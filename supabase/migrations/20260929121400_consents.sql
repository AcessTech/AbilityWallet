-- Ability Wallet — consents. Brief §2 rule 3 and Appendix A §6.4.
--
--   TIGHTEN = ask first. The change is inert until he taps Yes; the old value
--             stays live.
--   LOOSEN  = apply immediately and tell the other party.
--   Block removal is dual consent: both must agree.

-- Put a proposal in front of whoever has to answer it. The Member's answer
-- screen is the ONLY place capability descriptions appear.
create or replace function propose_consent(
  p_member   uuid,
  p_kind     consent_kind,
  p_headline text,
  p_body     text,
  p_payload  jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_consent uuid;
  v_proposer uuid := auth.uid();
  v_answers_on_member_side boolean := v_proposer <> p_member;
begin
  insert into consents (member_id, proposed_by, kind, payload, status,
                        expires_at)
  values (p_member, v_proposer, p_kind, p_payload, 'pending',
          now() + make_interval(days => config_int('consent_expiry_days')))
  returning id into v_consent;

  if v_answers_on_member_side then
    -- The Navigator proposed: the card goes on his Home.
    insert into home_cards (member_id, cls, kind, headline, body, proposal_id,
                            state, expires_at)
    values (p_member, 'CONSENT', p_kind::text, p_headline, p_body, v_consent,
            'queued', now() + make_interval(days => config_int('consent_expiry_days')));

    perform notify_member(p_member, 'B1a',
      (select first_name from profiles where id = v_proposer) || ' is asking you something',
      p_headline, jsonb_build_object('consent_id', v_consent));
  else
    -- He proposed: she answers, so it shows on her side as a request.
    perform raise_alert(p_member, 'A12', null,
      jsonb_build_object('consent_id', v_consent, 'kind', p_kind, 'headline', p_headline));
  end if;

  insert into activity_log (member_id, actor_id, actor_kind, event, detail, payload)
  values (p_member, v_proposer,
          case when v_proposer = p_member then 'member' else 'navigator' end,
          'consent_proposed', p_headline,
          jsonb_build_object('consent_id', v_consent, 'kind', p_kind));

  return v_consent;
end;
$$;

create or replace function withdraw_consent(p_consent uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update consents set status = 'withdrawn', answered_at = now()
   where id = p_consent and proposed_by = auth.uid() and status = 'pending';
  update home_cards set state = 'withdrawn'
   where proposal_id = p_consent and state in ('queued','shown');
end;
$$;

-- The Navigator answering a proposal the Member made.
create or replace function answer_consent_as_navigator(p_consent uuid, p_yes boolean)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare c consents;
begin
  select * into c from consents where id = p_consent for update;
  if c.id is null or c.status <> 'pending' then
    return jsonb_build_object('ok', false);
  end if;
  if not auth_is_navigator_of(c.member_id) then
    raise exception 'not this member''s Navigator';
  end if;

  update consents set status = case when p_yes then 'approved' else 'declined' end,
                      answered_at = now()
   where id = c.id;

  if p_yes then perform apply_consent(c.id); end if;

  insert into activity_log (member_id, actor_id, actor_kind, event, detail, payload)
  values (c.member_id, auth.uid(), 'navigator',
          case when p_yes then 'consent_approved' else 'consent_declined' end,
          c.kind::text, jsonb_build_object('consent_id', c.id));

  return jsonb_build_object('ok', true, 'approved', p_yes);
end;
$$;

-- ---------------------------------------------------- applying a consent ---

create or replace function apply_consent(p_consent uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  c consents;
  v_line budget_lines;
  v_block blocks;
begin
  select * into c from consents where id = p_consent;
  if c.id is null then return; end if;

  case c.kind
    when 'LIMIT_CHANGE' then
      update budget_lines
         set amount = coalesce((c.payload ->> 'amount')::numeric, amount),
             mode   = coalesce((c.payload ->> 'mode')::budget_mode, mode),
             period = coalesce((c.payload ->> 'period')::budget_period, period),
             pending_change = null
       where id = (c.payload ->> 'budget_line_id')::uuid;

    when 'LEVEL_UP' then
      update member_navigator
         set level = (c.payload ->> 'level')::int
       where member_id = c.member_id and navigator_id = c.proposed_by and status = 'active';

    when 'BLOCK_ADD' then
      update blocks set status = 'active', since = now(),
                        agreed_by = array[c.member_id, c.proposed_by]
       where id = (c.payload ->> 'block_id')::uuid;

    when 'BLOCK_REMOVE' then
      update blocks set status = 'ended'
       where id = (c.payload ->> 'block_id')::uuid;

    when 'GOAL_PROPOSAL' then
      update savings_goals set agreed_by = array[c.member_id, c.proposed_by]
       where id = (c.payload ->> 'goal_id')::uuid;

    when 'AUTO_MOVE' then
      update profiles set auto_move_enabled = (c.payload ->> 'enabled')::boolean
       where id = c.member_id;

    when 'AI_HELPER_ON' then
      update profiles set ai_helper_enabled = (c.payload ->> 'enabled')::boolean
       where id = c.member_id;

    else null;
  end case;

  insert into activity_log (member_id, actor_kind, event, detail, payload)
  values (c.member_id, 'system', 'consent_applied', c.kind::text,
          jsonb_build_object('consent_id', c.id));
end;
$$;

-- ------------------------------------------------------ budget proposals ---
-- Tightening a line means adding alert/stop, or lowering the amount on a line
-- that is already alert or stop. Everything else is a loosening.

create or replace function is_tightening(
  p_old_amount numeric, p_old_mode budget_mode,
  p_new_amount numeric, p_new_mode budget_mode
) returns boolean language sql immutable as $$
  select
    array_position(array['guide','alert','stop']::budget_mode[], p_new_mode)
      > array_position(array['guide','alert','stop']::budget_mode[], p_old_mode)
    or (p_old_mode <> 'guide' and p_new_amount < p_old_amount);
$$;

create or replace function propose_budget_change(
  p_line   uuid,
  p_amount numeric,
  p_mode   budget_mode,
  p_period budget_period default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  bl budget_lines;
  v_tighten boolean;
  v_consent uuid;
  v_by uuid := auth.uid();
begin
  select * into bl from budget_lines where id = p_line for update;
  if bl.id is null then raise exception 'no such budget line'; end if;

  v_tighten := is_tightening(bl.amount, bl.mode, p_amount, p_mode);

  if not v_tighten then
    update budget_lines
       set amount = p_amount, mode = p_mode, period = coalesce(p_period, period)
     where id = p_line;

    if v_by <> bl.member_id then
      perform notify_member(bl.member_id, 'B7', 'Something changed',
        bl.display_name || ' is now ' || to_char(p_amount, 'FM$999,999') || '.',
        jsonb_build_object('budget_line_id', p_line));
    end if;

    insert into activity_log (member_id, actor_id, actor_kind, event, detail)
    values (bl.member_id, v_by,
            case when v_by = bl.member_id then 'member' else 'navigator' end,
            'budget_changed',
            bl.display_name || ' set to ' || to_char(p_amount, 'FM$999,999'));

    return jsonb_build_object('applied', true, 'needs_consent', false);
  end if;

  -- Tightening: the old value stays live until he says yes.
  update budget_lines
     set pending_change = jsonb_build_object(
           'amount', p_amount, 'mode', p_mode,
           'period', coalesce(p_period, bl.period), 'proposed_by', v_by,
           'proposed_at', now())
   where id = p_line;

  v_consent := propose_consent(
    bl.member_id, 'LIMIT_CHANGE',
    bl.display_name || ' — ' || to_char(p_amount, 'FM$999,999'),
    case
      when p_mode = 'stop' and bl.mode <> 'stop'
        then 'Purchases over this would stop going through. OK?'
      when p_mode = 'alert' and bl.mode = 'guide'
        then 'Going over this would send a note. OK?'
      else 'This would lower what you have for ' || bl.display_name || '. OK?'
    end,
    jsonb_build_object('budget_line_id', p_line, 'amount', p_amount,
                       'mode', p_mode, 'period', coalesce(p_period, bl.period)));

  return jsonb_build_object('applied', false, 'needs_consent', true, 'consent_id', v_consent);
end;
$$;

-- ------------------------------------------------------- level proposals ---
-- Up needs his OK. Down takes effect at once with a notice: a decrease in
-- oversight never needs approval.

create or replace function propose_level_change(p_member uuid, p_level int)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  mn member_navigator;
  v_consent uuid;
  v_body text;
begin
  select * into mn from member_navigator
   where member_id = p_member and navigator_id = auth.uid() and status = 'active';
  if mn.id is null then raise exception 'not this member''s Navigator'; end if;

  if p_level <= mn.level then
    update member_navigator set level = p_level where id = mn.id;
    perform notify_member(p_member, 'B7', 'Something changed',
      'Some of the rules on your account were relaxed.',
      jsonb_build_object('level', p_level));
    insert into home_cards (member_id, cls, kind, headline, body, state)
    values (p_member, 'NOTICE', 'LEVEL_DOWN', 'Something changed',
            'Fewer rules apply to your card now.', 'queued');
    return jsonb_build_object('applied', true, 'needs_consent', false);
  end if;

  -- His card describes only the behaviour change. No level names or numbers.
  v_body := case p_level
    when 2 then 'Your Navigator would see your balance and what you spend. OK?'
    when 3 then 'Going over a limit would send them a note. OK?'
    when 4 then 'Right now, going over a limit sends a note. With this change, purchases over a limit are declined. OK?'
    when 5 then 'Your Navigator would look after your benefit money. OK?'
    else 'Something about how your account works would change. OK?'
  end;

  v_consent := propose_consent(p_member, 'LEVEL_UP', 'A change to your account', v_body,
                               jsonb_build_object('level', p_level));
  return jsonb_build_object('applied', false, 'needs_consent', true, 'consent_id', v_consent);
end;
$$;

-- -------------------------------------------------------------- blocks -----
-- Adding a block follows the tighten rule. Removing one is dual consent:
-- neither side can unilaterally unprotect.

create or replace function propose_block(
  p_member uuid, p_kind block_kind, p_target text, p_label text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_block uuid;
  v_consent uuid;
  v_by uuid := auth.uid();
begin
  insert into blocks (member_id, kind, target, label, status, agreed_by)
  values (p_member, p_kind, p_target, p_label, 'pending_add', array[v_by])
  returning id into v_block;

  if v_by = p_member then
    -- A self-block: she is the one who answers.
    v_consent := propose_consent(p_member, 'BLOCK_ADD',
      p_label, 'They asked to block this.',
      jsonb_build_object('block_id', v_block));
  else
    v_consent := propose_consent(p_member, 'BLOCK_ADD',
      p_label, 'This shop would stop working with your card. OK?',
      jsonb_build_object('block_id', v_block));
  end if;

  return jsonb_build_object('block_id', v_block, 'consent_id', v_consent);
end;
$$;

create or replace function propose_block_removal(p_block uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  b blocks;
  v_consent uuid;
begin
  select * into b from blocks where id = p_block for update;
  if b.id is null then raise exception 'no such block'; end if;

  update blocks set status = 'pending_remove', agreed_by = array[auth.uid()] where id = p_block;

  v_consent := propose_consent(b.member_id, 'BLOCK_REMOVE',
    b.label,
    case when auth.uid() = b.member_id
      then 'They asked to unblock this. It ends only if you agree too.'
      else 'This shop would work with your card again. OK?' end,
    jsonb_build_object('block_id', p_block));

  return jsonb_build_object('consent_id', v_consent);
end;
$$;

-- The card pause is available from Firm limits up, and is always announced.
create or replace function set_card_paused(p_member uuid, p_paused boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare v_level int;
begin
  select level into v_level from member_navigator
   where member_id = p_member and navigator_id = auth.uid() and status = 'active';
  if coalesce(v_level, 0) < 4 then
    raise exception 'pausing the card is not available at this level';
  end if;

  update member_cards set status = case when p_paused then 'paused' else 'active' end,
                          paused_by = case when p_paused then auth.uid() else null end,
                          paused_at = case when p_paused then now() else null end
   where member_id = p_member;

  if p_paused then
    insert into home_cards (member_id, cls, kind, headline, body, state, payload)
    values (p_member, 'NOTICE', 'CARD_PAUSED',
            (select first_name from profiles where id = auth.uid()) || ' paused your card',
            'Call them if you need it back on.', 'queued',
            jsonb_build_object('by', auth.uid()));
    perform notify_member(p_member, 'B7', 'Something changed',
      'Your card is paused.', '{}'::jsonb);
  end if;

  insert into activity_log (member_id, actor_id, actor_kind, event, detail)
  values (p_member, auth.uid(), 'navigator',
          case when p_paused then 'card_paused' else 'card_unpaused' end, '');
end;
$$;
