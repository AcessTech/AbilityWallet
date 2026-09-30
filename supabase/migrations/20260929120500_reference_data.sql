-- Ability Wallet — reference data. NOT test accounts: this is the taxonomy and
-- routing tables the engine needs on an empty database.

-- The 14-category spine (prd.md §5.6, settled Aug 7). The member-facing word is
-- what the Member sees; the QDE name is federal accounting and is never shown
-- to him. Plus Funeral & burial, a QDE handled at transaction level only and
-- never a budget row.

insert into spine_categories (id, member_word, navigator_word, qde, sub_labels, budgetable, sort_order) values
  ('money_in',    'Money in',          'Income',                  null,                                       '{}',                                            true,  1),
  ('home',        'Home',              'Housing',                 'Housing',                                  '{"Rent","Utilities","Home repairs & stuff"}',   true,  2),
  ('groceries',   'Groceries',         'Groceries',               'Food',                                     '{}',                                            true,  3),
  ('eating_out',  'Eating out',        'Eating out',              'Food',                                     '{}',                                            true,  4),
  ('around',      'Getting around',    'Transportation',          'Transportation',                           '{}',                                            true,  5),
  ('health',      'Health',            'Health',                  'Health & wellness',                        '{}',                                            true,  6),
  ('phone',       'Phone & internet',  'Phone & internet',        'Housing (utilities)',                      '{}',                                            true,  7),
  ('school',      'School & learning', 'Education',               'Education',                                '{}',                                            true,  8),
  ('work',        'Work & job stuff',  'Work',                    'Employment training & support',            '{}',                                            true,  9),
  ('tools',       'Tools that help me','Assistive technology',    'Assistive technology & personal support',  '{}',                                            true, 10),
  ('bills',       'Bills & subscriptions','Bills & subscriptions','Legal & financial services',               '{}',                                            true, 11),
  ('fun',         'Fun & games',       'Entertainment',           null,                                       '{}',                                            true, 12),
  ('shopping',    'Shopping',          'Shopping',                null,                                       '{}',                                            true, 13),
  ('savings',     'Savings & goals',   'Savings & goals',         null,                                       '{}',                                            true, 14),
  ('funeral',     'Funeral & burial',  'Funeral & burial',        'Funeral & burial',                         '{}',                                            false, 15);

-- MCC -> candidate QDE (Appendix A §2.4) and the block groups behind the
-- category toggles (Appendix A §6.5).
insert into mcc_categories (mcc, description, spine_id, candidate_qde, auto_assign, block_group) values
  ('5200','Home supply warehouse',        'home',      'Housing',        false, null),
  ('5211','Lumber & building materials',  'home',      'Housing',        false, null),
  ('5251','Hardware stores',              'home',      'Housing',        false, null),
  ('5712','Furniture',                    'home',      'Housing',        false, null),
  ('5713','Floor covering',               'home',      'Housing',        false, null),
  ('5714','Drapery & upholstery',         'home',      'Housing',        false, null),
  ('5718','Fireplaces',                   'home',      'Housing',        false, null),
  ('5719','Misc home furnishing',         'home',      'Housing',        false, null),
  ('4900','Utilities',                    'phone',     'Housing (utilities)', true,  null),
  ('6513','Real estate agents & rentals', 'home',      'Housing',        true,  null),
  ('4111','Commuter transport',           'around',    'Transportation', false, null),
  ('4121','Taxi & rideshare',             'around',    'Transportation', false, null),
  ('4131','Bus lines',                    'around',    'Transportation', false, null),
  ('4789','Transportation services',      'around',    'Transportation', false, null),
  ('5912','Drug stores & pharmacies',     'health',    'Health & wellness', false, null),
  ('8011','Doctors',                      'health',    'Health & wellness', false, null),
  ('8021','Dentists',                     'health',    'Health & wellness', false, null),
  ('8031','Osteopaths',                   'health',    'Health & wellness', false, null),
  ('8041','Chiropractors',                'health',    'Health & wellness', false, null),
  ('8042','Optometrists',                 'health',    'Health & wellness', false, null),
  ('8049','Podiatrists',                  'health',    'Health & wellness', false, null),
  ('8050','Nursing & personal care',      'health',    'Health & wellness', false, null),
  ('8062','Hospitals',                    'health',    'Health & wellness', false, null),
  ('8071','Medical labs',                 'health',    'Health & wellness', false, null),
  ('8099','Health services',              'health',    'Health & wellness', false, null),
  ('5411','Grocery stores',               'groceries', 'Food',           true,  null),
  ('5422','Meat provisioners',            'groceries', 'Food',           true,  null),
  ('5451','Dairy stores',                 'groceries', 'Food',           true,  null),
  ('5462','Bakeries',                     'groceries', 'Food',           true,  null),
  ('5499','Food stores',                  'groceries', 'Food',           true,  null),
  ('5812','Eating places & restaurants',  'eating_out','Food',           true,  null),
  ('5814','Fast food',                    'eating_out','Food',           true,  null),
  ('5541','Service stations',             'around',    'Transportation', true,  null),
  ('5542','Automated fuel dispensers',    'around',    'Transportation', true,  null),
  ('4814','Telecom',                      'phone',     'Housing (utilities)', true, null),
  ('4899','Cable & streaming',            'bills',     null,             true,  null),
  ('5815','Digital media',                'fun',       null,             true,  null),
  ('5816','Digital games',                'fun',       null,             true,  null),
  ('5732','Electronics',                  'shopping',  null,             false, null),
  ('5734','Computer software',            'shopping',  null,             false, null),
  ('5300','Wholesale clubs',              'shopping',  null,             false, null),
  ('5310','Discount stores',              'shopping',  null,             false, null),
  ('5311','Department stores',            'shopping',  null,             false, null),
  ('5399','General merchandise',          'shopping',  null,             false, null),
  ('5941','Sporting goods',               'shopping',  null,             false, null),
  ('5942','Book stores',                  'school',    'Education',      false, null),
  ('8220','Colleges & universities',      'school',    'Education',      true,  null),
  ('8299','Schools & educational services','school',   'Education',      true,  null),
  ('6011','ATM cash withdrawal',          null,        null,             false, null),
  -- Block groups. These MCCs back the category toggles on the Blocks screen.
  ('7995','Betting & casino gambling',    'fun',       null,             false, 'gambling'),
  ('7801','Online gambling',              'fun',       null,             false, 'gambling'),
  ('7802','Horse & dog racing',           'fun',       null,             false, 'gambling'),
  ('9754','Gambling & lottery',           'fun',       null,             false, 'gambling'),
  ('5813','Bars, taverns & lounges',      'eating_out',null,             false, 'bars'),
  ('5921','Liquor stores',                'shopping',  null,             false, 'bars'),
  ('7273','Dating services',              'shopping',  null,             false, 'dating'),
  ('5993','Cigar & smoke shops',          'shopping',  null,             false, 'smoke'),
  ('5122','Tobacco distributors',         'shopping',  null,             false, 'smoke'),
  ('4829','Money transfer',               'bills',     null,             false, 'money_transfer'),
  ('6051','Quasi-cash & money orders',    'bills',     null,             false, 'money_transfer'),
  ('6540','Stored value load',            'bills',     null,             false, 'money_transfer');

-- Known scams: always enforced, not per member, not configurable.
insert into known_scams (merchant_key, label) values
  ('giftcard-reload-now',   'Gift Card Reload Now'),
  ('irs-payment-center',    'IRS Payment Center'),
  ('social-security-fees',  'Social Security Fees'),
  ('prize-claim-center',    'Prize Claim Center'),
  ('tech-support-refund',   'Tech Support Refund'),
  ('crypto-quick-cash',     'Crypto Quick Cash');

-- Alert routing (Appendix B). One group per code.
insert into alert_group_map (code, grp, min_level, push_default, can_turn_off, wording) values
  ('A1','money',      2, false, true,  '{source} deposit: {amount}'),
  ('A2','money',      2, true,  true,  '{member}''s checking is below {threshold}'),
  ('A3','money',      2, true,  true,  'First payment to {merchant}: {amount}'),
  ('A4','card_safety',2, true,  false, 'Unusual activity: {summary}'),
  ('A5','card_safety',2, true,  false, '{member} reported the card lost or stolen. A new card is on the way.'),
  ('A6','declines',   2, true,  true,  'Declined: {merchant} {amount} — {reason}'),
  ('A7','limits',     3, true,  true,  'Over the {limit} limit: {merchant} {amount} ({overage} over)'),
  ('A8','benefits',   2, true,  true,  'Checking is on track to pass $2,000 by {last_day_of_month}'),
  ('A9','money',      2, false, true,  '{amount} moved to ABLE savings'),
  ('A10','money',     2, true,  false, '{member} moved {amount} of emergency money to spending'),
  ('A11','questions', 1, true,  true,  'Message from {member}'),
  ('A12','questions', 2, true,  false, '{member} asked to change something — open to see'),
  ('A13','questions', 2, true,  false, '{member} answered your request'),
  ('A14','questions', 2, false, true,  '{member} turned {state} the AI Navigator'),
  ('A15','money',     2, false, true,  '{merchant} {amount} paid back from ABLE savings'),
  ('A16','benefits',  2, true,  true,  '{member}''s rent money from ABLE needs to go out by {date}'),
  ('A17','benefits',  5, true,  false, '{member}''s Social Security report is due by {date}'),
  ('A18','setup',     1, true,  false, '{member} accepted. The account is open.'),
  ('A19','setup',     1, true,  false, 'The invite for {member} couldn''t be verified. Send a new one when you''re ready.'),
  ('A20','setup',     1, false, false, 'The invite for {member} expired. You can send a new one.'),
  ('A21','money',     2, false, true,  '{member}''s card was delivered'),
  ('A22','money',     2, false, true,  '{member} reached the {goal} goal');
