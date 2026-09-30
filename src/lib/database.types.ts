
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "accounts": {
                  Row: {
                    "balance": number,"created_at": string,"exclusion_ends_on": string | null,"id": string,"kind": Database["public"]['Enums']["account_kind"],"member_id": string,"name": string,"program_name": string | null
                  }
                  Insert: {
                    "balance"?: number,"created_at"?: string,"exclusion_ends_on"?: string | null,"id"?: string,"kind": Database["public"]['Enums']["account_kind"],"member_id": string,"name": string,"program_name"?: string | null
                  }
                  Update: {
                    "balance"?: number,"created_at"?: string,"exclusion_ends_on"?: string | null,"id"?: string,"kind"?: Database["public"]['Enums']["account_kind"],"member_id"?: string,"name"?: string,"program_name"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "accounts_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"activity_log": {
                  Row: {
                    "actor_id": string | null,"actor_kind": string,"created_at": string,"detail": string,"event": string,"id": string,"member_id": string,"payload": NonNullable<Json>
                  }
                  Insert: {
                    "actor_id"?: string | null,"actor_kind"?: string,"created_at"?: string,"detail"?: string,"event": string,"id"?: string,"member_id": string,"payload"?: NonNullable<Json>
                  }
                  Update: {
                    "actor_id"?: string | null,"actor_kind"?: string,"created_at"?: string,"detail"?: string,"event"?: string,"id"?: string,"member_id"?: string,"payload"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "activity_log_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activity_log_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"alert_group_map": {
                  Row: {
                    "can_turn_off": boolean,"code": string,"grp": Database["public"]['Enums']["alert_group"],"min_level": number,"push_default": boolean,"wording": string
                  }
                  Insert: {
                    "can_turn_off"?: boolean,"code": string,"grp": Database["public"]['Enums']["alert_group"],"min_level"?: number,"push_default"?: boolean,"wording": string
                  }
                  Update: {
                    "can_turn_off"?: boolean,"code"?: string,"grp"?: Database["public"]['Enums']["alert_group"],"min_level"?: number,"push_default"?: boolean,"wording"?: string
                  }
                  Relationships: [
                    
                  ]
                },"alert_prefs": {
                  Row: {
                    "channels": (Database["public"]['Enums']["notify_channel"])[],"grp": Database["public"]['Enums']["alert_group"],"navigator_id": string
                  }
                  Insert: {
                    "channels"?: (Database["public"]['Enums']["notify_channel"])[],"grp": Database["public"]['Enums']["alert_group"],"navigator_id": string
                  }
                  Update: {
                    "channels"?: (Database["public"]['Enums']["notify_channel"])[],"grp"?: Database["public"]['Enums']["alert_group"],"navigator_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "alert_prefs_navigator_id_fkey"
      columns: ["navigator_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"alerts": {
                  Row: {
                    "channels_sent": (Database["public"]['Enums']["notify_channel"])[],"code": string,"created_at": string,"delivered_at": string | null,"grp": Database["public"]['Enums']["alert_group"],"id": string,"member_id": string,"navigator_id": string,"payload": NonNullable<Json>,"read_at": string | null,"title": string
                  }
                  Insert: {
                    "channels_sent"?: (Database["public"]['Enums']["notify_channel"])[],"code": string,"created_at"?: string,"delivered_at"?: string | null,"grp": Database["public"]['Enums']["alert_group"],"id"?: string,"member_id": string,"navigator_id": string,"payload"?: NonNullable<Json>,"read_at"?: string | null,"title": string
                  }
                  Update: {
                    "channels_sent"?: (Database["public"]['Enums']["notify_channel"])[],"code"?: string,"created_at"?: string,"delivered_at"?: string | null,"grp"?: Database["public"]['Enums']["alert_group"],"id"?: string,"member_id"?: string,"navigator_id"?: string,"payload"?: NonNullable<Json>,"read_at"?: string | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "alerts_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "alerts_navigator_id_fkey"
      columns: ["navigator_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"app_config": {
                  Row: {
                    "key": string,"note": string | null,"updated_at": string,"value": NonNullable<Json>
                  }
                  Insert: {
                    "key": string,"note"?: string | null,"updated_at"?: string,"value": NonNullable<Json>
                  }
                  Update: {
                    "key"?: string,"note"?: string | null,"updated_at"?: string,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"blocks": {
                  Row: {
                    "agreed_by": (string)[],"attempts_stopped": number,"created_at": string,"id": string,"kind": Database["public"]['Enums']["block_kind"],"label": string,"member_id": string,"since": string | null,"status": Database["public"]['Enums']["block_status"],"target": string
                  }
                  Insert: {
                    "agreed_by"?: (string)[],"attempts_stopped"?: number,"created_at"?: string,"id"?: string,"kind": Database["public"]['Enums']["block_kind"],"label": string,"member_id": string,"since"?: string | null,"status"?: Database["public"]['Enums']["block_status"],"target": string
                  }
                  Update: {
                    "agreed_by"?: (string)[],"attempts_stopped"?: number,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["block_kind"],"label"?: string,"member_id"?: string,"since"?: string | null,"status"?: Database["public"]['Enums']["block_status"],"target"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "blocks_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"budget_lines": {
                  Row: {
                    "amount": number,"archived_at": string | null,"category": string,"created_at": string,"display_name": string,"id": string,"member_id": string,"mode": Database["public"]['Enums']["budget_mode"],"pending_change": Json | null,"period": Database["public"]['Enums']["budget_period"],"sort_order": number
                  }
                  Insert: {
                    "amount": number,"archived_at"?: string | null,"category": string,"created_at"?: string,"display_name": string,"id"?: string,"member_id": string,"mode"?: Database["public"]['Enums']["budget_mode"],"pending_change"?: Json | null,"period"?: Database["public"]['Enums']["budget_period"],"sort_order"?: number
                  }
                  Update: {
                    "amount"?: number,"archived_at"?: string | null,"category"?: string,"created_at"?: string,"display_name"?: string,"id"?: string,"member_id"?: string,"mode"?: Database["public"]['Enums']["budget_mode"],"pending_change"?: Json | null,"period"?: Database["public"]['Enums']["budget_period"],"sort_order"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "budget_lines_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"chat_messages": {
                  Row: {
                    "action": Json | null,"action_status": Database["public"]['Enums']["msg_action_status"] | null,"body": string,"created_at": string,"id": string,"sender": Database["public"]['Enums']["msg_sender"],"sender_id": string | null,"thread_id": string,"txn_id": string | null
                  }
                  Insert: {
                    "action"?: Json | null,"action_status"?: Database["public"]['Enums']["msg_action_status"] | null,"body"?: string,"created_at"?: string,"id"?: string,"sender": Database["public"]['Enums']["msg_sender"],"sender_id"?: string | null,"thread_id": string,"txn_id"?: string | null
                  }
                  Update: {
                    "action"?: Json | null,"action_status"?: Database["public"]['Enums']["msg_action_status"] | null,"body"?: string,"created_at"?: string,"id"?: string,"sender"?: Database["public"]['Enums']["msg_sender"],"sender_id"?: string | null,"thread_id"?: string,"txn_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "chat_messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "chat_messages_thread_id_fkey"
      columns: ["thread_id"]
isOneToOne: false
      referencedRelation: "chat_threads"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "chat_messages_txn_id_fkey"
      columns: ["txn_id"]
isOneToOne: false
      referencedRelation: "transactions"
      referencedColumns: ["id"]
    }
                  ]
                },"chat_threads": {
                  Row: {
                    "created_at": string,"id": string,"kind": Database["public"]['Enums']["thread_kind"],"member_id": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["thread_kind"],"member_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["thread_kind"],"member_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "chat_threads_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"consents": {
                  Row: {
                    "answered_at": string | null,"created_at": string,"expires_at": string,"id": string,"kind": Database["public"]['Enums']["consent_kind"],"member_id": string,"payload": NonNullable<Json>,"proposed_by": string,"status": Database["public"]['Enums']["consent_status"]
                  }
                  Insert: {
                    "answered_at"?: string | null,"created_at"?: string,"expires_at"?: string,"id"?: string,"kind": Database["public"]['Enums']["consent_kind"],"member_id": string,"payload"?: NonNullable<Json>,"proposed_by": string,"status"?: Database["public"]['Enums']["consent_status"]
                  }
                  Update: {
                    "answered_at"?: string | null,"created_at"?: string,"expires_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["consent_kind"],"member_id"?: string,"payload"?: NonNullable<Json>,"proposed_by"?: string,"status"?: Database["public"]['Enums']["consent_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "consents_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "consents_proposed_by_fkey"
      columns: ["proposed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"disputes": {
                  Row: {
                    "created_at": string,"id": string,"kind": Database["public"]['Enums']["dispute_kind"],"member_id": string,"opened_via": string,"reason": string,"status": Database["public"]['Enums']["dispute_status"],"transaction_id": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"kind": Database["public"]['Enums']["dispute_kind"],"member_id": string,"opened_via"?: string,"reason"?: string,"status"?: Database["public"]['Enums']["dispute_status"],"transaction_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["dispute_kind"],"member_id"?: string,"opened_via"?: string,"reason"?: string,"status"?: Database["public"]['Enums']["dispute_status"],"transaction_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "disputes_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "disputes_transaction_id_fkey"
      columns: ["transaction_id"]
isOneToOne: false
      referencedRelation: "transactions"
      referencedColumns: ["id"]
    }
                  ]
                },"federal_holidays": {
                  Row: {
                    "name": string,"on_date": string
                  }
                  Insert: {
                    "name": string,"on_date": string
                  }
                  Update: {
                    "name"?: string,"on_date"?: string
                  }
                  Relationships: [
                    
                  ]
                },"fiduciary_documents": {
                  Row: {
                    "created_at": string,"doc_type": string,"file_path": string | null,"id": string,"member_id": string,"navigator_id": string,"reviewed_at": string | null,"status": string
                  }
                  Insert: {
                    "created_at"?: string,"doc_type": string,"file_path"?: string | null,"id"?: string,"member_id": string,"navigator_id": string,"reviewed_at"?: string | null,"status"?: string
                  }
                  Update: {
                    "created_at"?: string,"doc_type"?: string,"file_path"?: string | null,"id"?: string,"member_id"?: string,"navigator_id"?: string,"reviewed_at"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "fiduciary_documents_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fiduciary_documents_navigator_id_fkey"
      columns: ["navigator_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"home_cards": {
                  Row: {
                    "answered_at": string | null,"body": string,"cls": Database["public"]['Enums']["card_class"],"created_at": string,"expires_at": string | null,"headline": string,"id": string,"kind": string | null,"member_id": string,"payload": NonNullable<Json>,"proposal_id": string | null,"shown_at": string | null,"state": Database["public"]['Enums']["card_state"],"suggested_amount": number | null,"txn_id": string | null
                  }
                  Insert: {
                    "answered_at"?: string | null,"body": string,"cls": Database["public"]['Enums']["card_class"],"created_at"?: string,"expires_at"?: string | null,"headline": string,"id"?: string,"kind"?: string | null,"member_id": string,"payload"?: NonNullable<Json>,"proposal_id"?: string | null,"shown_at"?: string | null,"state"?: Database["public"]['Enums']["card_state"],"suggested_amount"?: number | null,"txn_id"?: string | null
                  }
                  Update: {
                    "answered_at"?: string | null,"body"?: string,"cls"?: Database["public"]['Enums']["card_class"],"created_at"?: string,"expires_at"?: string | null,"headline"?: string,"id"?: string,"kind"?: string | null,"member_id"?: string,"payload"?: NonNullable<Json>,"proposal_id"?: string | null,"shown_at"?: string | null,"state"?: Database["public"]['Enums']["card_state"],"suggested_amount"?: number | null,"txn_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "home_cards_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "home_cards_txn_id_fkey"
      columns: ["txn_id"]
isOneToOne: false
      referencedRelation: "transactions"
      referencedColumns: ["id"]
    }
                  ]
                },"income_schedules": {
                  Row: {
                    "amount": number,"created_at": string,"cycles_seen": number,"id": string,"kind": Database["public"]['Enums']["income_kind"],"last_seen_on": string | null,"member_id": string,"merchant_key": string,"prediction_confidence": Database["public"]['Enums']["confidence"],"rule": NonNullable<Json>,"source": string
                  }
                  Insert: {
                    "amount": number,"created_at"?: string,"cycles_seen"?: number,"id"?: string,"kind": Database["public"]['Enums']["income_kind"],"last_seen_on"?: string | null,"member_id": string,"merchant_key": string,"prediction_confidence"?: Database["public"]['Enums']["confidence"],"rule"?: NonNullable<Json>,"source": string
                  }
                  Update: {
                    "amount"?: number,"created_at"?: string,"cycles_seen"?: number,"id"?: string,"kind"?: Database["public"]['Enums']["income_kind"],"last_seen_on"?: string | null,"member_id"?: string,"merchant_key"?: string,"prediction_confidence"?: Database["public"]['Enums']["confidence"],"rule"?: NonNullable<Json>,"source"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "income_schedules_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"known_scams": {
                  Row: {
                    "added_at": string,"id": string,"label": string,"merchant_key": string
                  }
                  Insert: {
                    "added_at"?: string,"id"?: string,"label": string,"merchant_key": string
                  }
                  Update: {
                    "added_at"?: string,"id"?: string,"label"?: string,"merchant_key"?: string
                  }
                  Relationships: [
                    
                  ]
                },"linked_banks": {
                  Row: {
                    "account_type": string,"created_at": string,"id": string,"institution": string,"is_default": boolean,"last4": string,"owner_id": string
                  }
                  Insert: {
                    "account_type"?: string,"created_at"?: string,"id"?: string,"institution": string,"is_default"?: boolean,"last4": string,"owner_id": string
                  }
                  Update: {
                    "account_type"?: string,"created_at"?: string,"id"?: string,"institution"?: string,"is_default"?: boolean,"last4"?: string,"owner_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "linked_banks_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"mcc_categories": {
                  Row: {
                    "auto_assign": boolean,"block_group": string | null,"candidate_qde": string | null,"description": string,"mcc": string,"spine_id": string | null
                  }
                  Insert: {
                    "auto_assign"?: boolean,"block_group"?: string | null,"candidate_qde"?: string | null,"description": string,"mcc": string,"spine_id"?: string | null
                  }
                  Update: {
                    "auto_assign"?: boolean,"block_group"?: string | null,"candidate_qde"?: string | null,"description"?: string,"mcc"?: string,"spine_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "mcc_categories_spine_id_fkey"
      columns: ["spine_id"]
isOneToOne: false
      referencedRelation: "spine_categories"
      referencedColumns: ["id"]
    }
                  ]
                },"member_cards": {
                  Row: {
                    "brand": string,"created_at": string,"delivered_at": string | null,"expires_on": string,"id": string,"last4": string,"member_id": string,"paused_at": string | null,"paused_by": string | null,"shipped_at": string | null,"status": Database["public"]['Enums']["card_status"]
                  }
                  Insert: {
                    "brand"?: string,"created_at"?: string,"delivered_at"?: string | null,"expires_on": string,"id"?: string,"last4": string,"member_id": string,"paused_at"?: string | null,"paused_by"?: string | null,"shipped_at"?: string | null,"status"?: Database["public"]['Enums']["card_status"]
                  }
                  Update: {
                    "brand"?: string,"created_at"?: string,"delivered_at"?: string | null,"expires_on"?: string,"id"?: string,"last4"?: string,"member_id"?: string,"paused_at"?: string | null,"paused_by"?: string | null,"shipped_at"?: string | null,"status"?: Database["public"]['Enums']["card_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "member_cards_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "member_cards_paused_by_fkey"
      columns: ["paused_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"member_facts": {
                  Row: {
                    "fact_confidence": Database["public"]['Enums']["confidence"],"id": string,"key": string,"member_id": string,"no_answer_count": number,"since": string,"source": string,"suppressed_until": string | null,"value": string
                  }
                  Insert: {
                    "fact_confidence"?: Database["public"]['Enums']["confidence"],"id"?: string,"key": string,"member_id": string,"no_answer_count"?: number,"since"?: string,"source": string,"suppressed_until"?: string | null,"value": string
                  }
                  Update: {
                    "fact_confidence"?: Database["public"]['Enums']["confidence"],"id"?: string,"key"?: string,"member_id"?: string,"no_answer_count"?: number,"since"?: string,"source"?: string,"suppressed_until"?: string | null,"value"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "member_facts_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"member_navigator": {
                  Row: {
                    "created_at": string,"ended_at": string | null,"id": string,"invite_dob_attempts": number,"invite_email": string | null,"invite_expires_at": string | null,"invite_payload": NonNullable<Json>,"invite_sent_at": string | null,"invite_token": string | null,"is_primary": boolean,"level": number,"member_id": string | null,"navigator_id": string | null,"started_at": string | null,"status": Database["public"]['Enums']["link_status"]
                  }
                  Insert: {
                    "created_at"?: string,"ended_at"?: string | null,"id"?: string,"invite_dob_attempts"?: number,"invite_email"?: string | null,"invite_expires_at"?: string | null,"invite_payload"?: NonNullable<Json>,"invite_sent_at"?: string | null,"invite_token"?: string | null,"is_primary"?: boolean,"level"?: number,"member_id"?: string | null,"navigator_id"?: string | null,"started_at"?: string | null,"status"?: Database["public"]['Enums']["link_status"]
                  }
                  Update: {
                    "created_at"?: string,"ended_at"?: string | null,"id"?: string,"invite_dob_attempts"?: number,"invite_email"?: string | null,"invite_expires_at"?: string | null,"invite_payload"?: NonNullable<Json>,"invite_sent_at"?: string | null,"invite_token"?: string | null,"is_primary"?: boolean,"level"?: number,"member_id"?: string | null,"navigator_id"?: string | null,"started_at"?: string | null,"status"?: Database["public"]['Enums']["link_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "member_navigator_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "member_navigator_navigator_id_fkey"
      columns: ["navigator_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"member_notifications": {
                  Row: {
                    "code": string,"created_at": string,"id": string,"in_app_text": string,"lock_text": string,"member_id": string,"payload": NonNullable<Json>,"read_at": string | null
                  }
                  Insert: {
                    "code": string,"created_at"?: string,"id"?: string,"in_app_text": string,"lock_text": string,"member_id": string,"payload"?: NonNullable<Json>,"read_at"?: string | null
                  }
                  Update: {
                    "code"?: string,"created_at"?: string,"id"?: string,"in_app_text"?: string,"lock_text"?: string,"member_id"?: string,"payload"?: NonNullable<Json>,"read_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "member_notifications_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"merchant_rules": {
                  Row: {
                    "ask": boolean,"auto_reimburse": boolean,"category": string | null,"created_at": string,"id": string,"member_id": string,"merchant_key": string,"merchant_label": string,"qde": string | null,"source": string
                  }
                  Insert: {
                    "ask"?: boolean,"auto_reimburse"?: boolean,"category"?: string | null,"created_at"?: string,"id"?: string,"member_id": string,"merchant_key": string,"merchant_label": string,"qde"?: string | null,"source": string
                  }
                  Update: {
                    "ask"?: boolean,"auto_reimburse"?: boolean,"category"?: string | null,"created_at"?: string,"id"?: string,"member_id"?: string,"merchant_key"?: string,"merchant_label"?: string,"qde"?: string | null,"source"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "merchant_rules_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"outbound_messages": {
                  Row: {
                    "body": string,"channel": Database["public"]['Enums']["notify_channel"],"created_at": string,"id": string,"profile_id": string | null,"reason_not_sent": string | null,"sent": boolean,"subject": string | null,"to_address": string
                  }
                  Insert: {
                    "body": string,"channel": Database["public"]['Enums']["notify_channel"],"created_at"?: string,"id"?: string,"profile_id"?: string | null,"reason_not_sent"?: string | null,"sent"?: boolean,"subject"?: string | null,"to_address": string
                  }
                  Update: {
                    "body"?: string,"channel"?: Database["public"]['Enums']["notify_channel"],"created_at"?: string,"id"?: string,"profile_id"?: string | null,"reason_not_sent"?: string | null,"sent"?: boolean,"subject"?: string | null,"to_address"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "outbound_messages_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"predicted_deposits": {
                  Row: {
                    "amount": number,"created_at": string,"expected_on": string,"id": string,"member_id": string,"prediction_confidence": Database["public"]['Enums']["confidence"],"schedule_id": string | null,"source": string
                  }
                  Insert: {
                    "amount": number,"created_at"?: string,"expected_on": string,"id"?: string,"member_id": string,"prediction_confidence"?: Database["public"]['Enums']["confidence"],"schedule_id"?: string | null,"source": string
                  }
                  Update: {
                    "amount"?: number,"created_at"?: string,"expected_on"?: string,"id"?: string,"member_id"?: string,"prediction_confidence"?: Database["public"]['Enums']["confidence"],"schedule_id"?: string | null,"source"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "predicted_deposits_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "predicted_deposits_schedule_id_fkey"
      columns: ["schedule_id"]
isOneToOne: false
      referencedRelation: "income_schedules"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "address_line1": string | null,"address_line2": string | null,"ai_helper_enabled": boolean,"auto_move_enabled": boolean,"city": string | null,"created_at": string,"dob": string | null,"email": string | null,"face_id_enabled": boolean,"first_name": string,"id": string,"last_name": string,"onboarding_done": boolean,"phone": string | null,"postal_code": string | null,"reading_level": string,"role": Database["public"]['Enums']["app_role"],"state": string | null,"updated_at": string
                  }
                  Insert: {
                    "address_line1"?: string | null,"address_line2"?: string | null,"ai_helper_enabled"?: boolean,"auto_move_enabled"?: boolean,"city"?: string | null,"created_at"?: string,"dob"?: string | null,"email"?: string | null,"face_id_enabled"?: boolean,"first_name"?: string,"id": string,"last_name"?: string,"onboarding_done"?: boolean,"phone"?: string | null,"postal_code"?: string | null,"reading_level"?: string,"role": Database["public"]['Enums']["app_role"],"state"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "address_line1"?: string | null,"address_line2"?: string | null,"ai_helper_enabled"?: boolean,"auto_move_enabled"?: boolean,"city"?: string | null,"created_at"?: string,"dob"?: string | null,"email"?: string | null,"face_id_enabled"?: boolean,"first_name"?: string,"id"?: string,"last_name"?: string,"onboarding_done"?: boolean,"phone"?: string | null,"postal_code"?: string | null,"reading_level"?: string,"role"?: Database["public"]['Enums']["app_role"],"state"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"push_tokens": {
                  Row: {
                    "created_at": string,"id": string,"platform": string,"profile_id": string,"token": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"platform"?: string,"profile_id": string,"token": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"platform"?: string,"profile_id"?: string,"token"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "push_tokens_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"quiet_hours": {
                  Row: {
                    "enabled": boolean,"ends_at": string,"navigator_id": string,"starts_at": string
                  }
                  Insert: {
                    "enabled"?: boolean,"ends_at"?: string,"navigator_id": string,"starts_at"?: string
                  }
                  Update: {
                    "enabled"?: boolean,"ends_at"?: string,"navigator_id"?: string,"starts_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "quiet_hours_navigator_id_fkey"
      columns: ["navigator_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"safety_escalations": {
                  Row: {
                    "created_at": string,"id": string,"member_id": string,"note": string,"status": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"member_id": string,"note": string,"status"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"member_id"?: string,"note"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "safety_escalations_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"savings_goals": {
                  Row: {
                    "account_id": string | null,"agreed_by": (string)[],"created_at": string,"id": string,"member_id": string,"name": string,"reached_at": string | null,"saved": number,"target": number
                  }
                  Insert: {
                    "account_id"?: string | null,"agreed_by"?: (string)[],"created_at"?: string,"id"?: string,"member_id": string,"name": string,"reached_at"?: string | null,"saved"?: number,"target": number
                  }
                  Update: {
                    "account_id"?: string | null,"agreed_by"?: (string)[],"created_at"?: string,"id"?: string,"member_id"?: string,"name"?: string,"reached_at"?: string | null,"saved"?: number,"target"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "savings_goals_account_id_fkey"
      columns: ["account_id"]
isOneToOne: false
      referencedRelation: "accounts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "savings_goals_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"spine_categories": {
                  Row: {
                    "budgetable": boolean,"id": string,"member_word": string,"navigator_word": string,"qde": string | null,"sort_order": number,"sub_labels": (string)[]
                  }
                  Insert: {
                    "budgetable"?: boolean,"id": string,"member_word": string,"navigator_word": string,"qde"?: string | null,"sort_order": number,"sub_labels"?: (string)[]
                  }
                  Update: {
                    "budgetable"?: boolean,"id"?: string,"member_word"?: string,"navigator_word"?: string,"qde"?: string | null,"sort_order"?: number,"sub_labels"?: (string)[]
                  }
                  Relationships: [
                    
                  ]
                },"subscriptions": {
                  Row: {
                    "created_at": string,"id": string,"navigator_id": string,"plan": string,"price_cents": number,"renews_on": string | null,"status": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"navigator_id": string,"plan"?: string,"price_cents"?: number,"renews_on"?: string | null,"status"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"navigator_id"?: string,"plan"?: string,"price_cents"?: number,"renews_on"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "subscriptions_navigator_id_fkey"
      columns: ["navigator_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"transactions": {
                  Row: {
                    "account_id": string,"amount": number,"budget_line_id": string | null,"category": string | null,"created_at": string,"declined_reason": string | null,"id": string,"mcc": string | null,"member_id": string,"merchant": string,"merchant_key": string,"needs_answer": boolean,"occurred_at": string,"qde_category": string | null,"qde_confidence": Database["public"]['Enums']["confidence"] | null,"rail": string,"receipt_path": string | null,"status": Database["public"]['Enums']["txn_status"]
                  }
                  Insert: {
                    "account_id": string,"amount": number,"budget_line_id"?: string | null,"category"?: string | null,"created_at"?: string,"declined_reason"?: string | null,"id"?: string,"mcc"?: string | null,"member_id": string,"merchant": string,"merchant_key": string,"needs_answer"?: boolean,"occurred_at"?: string,"qde_category"?: string | null,"qde_confidence"?: Database["public"]['Enums']["confidence"] | null,"rail"?: string,"receipt_path"?: string | null,"status"?: Database["public"]['Enums']["txn_status"]
                  }
                  Update: {
                    "account_id"?: string,"amount"?: number,"budget_line_id"?: string | null,"category"?: string | null,"created_at"?: string,"declined_reason"?: string | null,"id"?: string,"mcc"?: string | null,"member_id"?: string,"merchant"?: string,"merchant_key"?: string,"needs_answer"?: boolean,"occurred_at"?: string,"qde_category"?: string | null,"qde_confidence"?: Database["public"]['Enums']["confidence"] | null,"rail"?: string,"receipt_path"?: string | null,"status"?: Database["public"]['Enums']["txn_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "transactions_account_id_fkey"
      columns: ["account_id"]
isOneToOne: false
      referencedRelation: "accounts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "transactions_budget_line_id_fkey"
      columns: ["budget_line_id"]
isOneToOne: false
      referencedRelation: "budget_lines"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "transactions_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"transfers": {
                  Row: {
                    "amount": number,"created_at": string,"from_account_id": string | null,"from_linked_bank": string | null,"id": string,"initiated_by": string | null,"member_id": string,"memo": string | null,"next_run_on": string | null,"repeats_monthly": boolean,"status": Database["public"]['Enums']["transfer_status"],"to_account_id": string | null
                  }
                  Insert: {
                    "amount": number,"created_at"?: string,"from_account_id"?: string | null,"from_linked_bank"?: string | null,"id"?: string,"initiated_by"?: string | null,"member_id": string,"memo"?: string | null,"next_run_on"?: string | null,"repeats_monthly"?: boolean,"status"?: Database["public"]['Enums']["transfer_status"],"to_account_id"?: string | null
                  }
                  Update: {
                    "amount"?: number,"created_at"?: string,"from_account_id"?: string | null,"from_linked_bank"?: string | null,"id"?: string,"initiated_by"?: string | null,"member_id"?: string,"memo"?: string | null,"next_run_on"?: string | null,"repeats_monthly"?: boolean,"status"?: Database["public"]['Enums']["transfer_status"],"to_account_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "transfers_from_account_id_fkey"
      columns: ["from_account_id"]
isOneToOne: false
      referencedRelation: "accounts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "transfers_from_linked_bank_fkey"
      columns: ["from_linked_bank"]
isOneToOne: false
      referencedRelation: "linked_banks"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "transfers_initiated_by_fkey"
      columns: ["initiated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "transfers_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "transfers_to_account_id_fkey"
      columns: ["to_account_id"]
isOneToOne: false
      referencedRelation: "accounts"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "accept_member_invite":
{ Args: { "p_token": string }; Returns: Json
                           },
"account_of":
{ Args: { "p_kind": Database["public"]['Enums']["account_kind"],"p_member": string }; Returns: string
                           },
"ai_should_reply":
{ Args: { "p_thread": string }; Returns: boolean
                           },
"answer_able_category":
{ Args: { "p_payload": Json,"p_yes": boolean,"v": Database["public"]['Tables']["home_cards"]['Row'] }; Returns: Json
                           },
"answer_consent":
{ Args: { "p_yes": boolean,"v": Database["public"]['Tables']["home_cards"]['Row'] }; Returns: Json
                           },
"answer_consent_as_navigator":
{ Args: { "p_consent": string,"p_yes": boolean }; Returns: Json
                           },
"answer_home_card":
{ Args: { "p_card": string,"p_payload"?: Json,"p_yes": boolean }; Returns: Json
                           },
"answer_income_tag":
{ Args: { "p_payload": Json,"p_yes": boolean,"v": Database["public"]['Tables']["home_cards"]['Row'] }; Returns: Json
                           },
"answer_qde_offer":
{ Args: { "p_payload": Json,"p_yes": boolean,"v": Database["public"]['Tables']["home_cards"]['Row'] }; Returns: Json
                           },
"answer_sentinel":
{ Args: { "p_yes": boolean,"v": Database["public"]['Tables']["home_cards"]['Row'] }; Returns: Json
                           },
"apply_consent":
{ Args: { "p_consent": string }; Returns: undefined
                           },
"auth_is_navigator_of":
{ Args: { "p_member": string }; Returns: boolean
                           },
"auth_level_for":
{ Args: { "p_member": string }; Returns: number
                           },
"auth_sees_money_of":
{ Args: { "p_member": string }; Returns: boolean
                           },
"auth_visible_members":
{ Args: Record<PropertyKey, never>; Returns: string[]
                           },
"authorize_purchase":
{ Args: { "p_amount": number,"p_mcc": string,"p_member": string,"p_merchant_key": string }; Returns: Json
                           },
"budget_spent":
{ Args: { "p_at"?: string,"p_line": string }; Returns: number
                           },
"budget_status":
{ Args: { "p_member": string }; Returns: {
              "amount": number,"category": string,"display_name": string,"fraction_left": number,"id": string,"mode": Database["public"]['Enums']["budget_mode"],"pending_change": Json,"period": Database["public"]['Enums']["budget_period"],"remaining": number,"sort_order": number,"spent": number
            }[]
                           },
"config_int":
{ Args: { "p_key": string }; Returns: number
                           },
"config_num":
{ Args: { "p_key": string }; Returns: number
                           },
"confirm_chat_action":
{ Args: { "p_message": string,"p_yes": boolean }; Returns: Json
                           },
"create_member_invite":
{ Args: { "p_address": Json,"p_dob": string,"p_email": string,"p_first_name": string,"p_last_name": string,"p_level": number,"p_send"?: boolean,"p_ship": Json }; Returns: Json
                           },
"demo_accounts_loaded":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"detect_recurring":
{ Args: { "p_member": string }; Returns: undefined
                           },
"dismiss_notice":
{ Args: { "p_card": string }; Returns: undefined
                           },
"escalate_safety_concern":
{ Args: { "p_member": string,"p_note": string }; Returns: undefined
                           },
"expire_cards":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"expire_consents":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"file_dispute":
{ Args: { "p_member": string,"p_reason": string,"p_txn_id": string }; Returns: Json
                           },
"finish_navigator_signup":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"finish_self_signup":
{ Args: { "p_address": Json,"p_dob": string }; Returns: Json
                           },
"generate_able_answers":
{ Args: { "p_member": string }; Returns: undefined
                           },
"generate_home_cards":
{ Args: { "p_member": string }; Returns: undefined
                           },
"generate_income_tags":
{ Args: { "p_member": string }; Returns: undefined
                           },
"generate_qde_offers":
{ Args: { "p_force"?: boolean,"p_member": string }; Returns: undefined
                           },
"invite_navigator":
{ Args: { "p_email": string,"p_first_name": string }; Returns: Json
                           },
"is_banking_day":
{ Args: { "p_date": string }; Returns: boolean
                           },
"is_tightening":
{ Args: { "p_new_amount": number,"p_new_mode": Database["public"]['Enums']["budget_mode"],"p_old_amount": number,"p_old_mode": Database["public"]['Enums']["budget_mode"] }; Returns: boolean
                           },
"issue_member_card":
{ Args: { "p_member": string }; Returns: undefined
                           },
"last_dow_of_month":
{ Args: { "p_dow": number,"p_month": number,"p_year": number }; Returns: string
                           },
"mark_card_shown":
{ Args: { "p_card": string }; Returns: undefined
                           },
"member_home":
{ Args: { "p_member"?: string }; Returns: Json
                           },
"member_save":
{ Args: { "p_member"?: string }; Returns: Json
                           },
"member_spend":
{ Args: { "p_member"?: string }; Returns: Json
                           },
"move_money":
{ Args: { "p_actor"?: string,"p_amount": number,"p_from": string,"p_member": string,"p_memo": string,"p_to": string }; Returns: string
                           },
"my_context":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"navigator_activity":
{ Args: { "p_member": string }; Returns: Json
                           },
"navigator_analytics":
{ Args: { "p_member": string,"p_months"?: number }; Returns: Json
                           },
"navigator_home":
{ Args: { "p_member": string }; Returns: Json
                           },
"navigator_plan":
{ Args: { "p_member": string }; Returns: Json
                           },
"navigator_send_money":
{ Args: { "p_amount": number,"p_member": string,"p_repeat"?: boolean }; Returns: Json
                           },
"next_home_card":
{ Args: { "p_member": string }; Returns: {
              "answered_at": string | null,
"body": string,
"cls": Database["public"]['Enums']["card_class"],
"created_at": string,
"expires_at": string | null,
"headline": string,
"id": string,
"kind": string | null,
"member_id": string,
"payload": NonNullable<Json>,
"proposal_id": string | null,
"shown_at": string | null,
"state": Database["public"]['Enums']["card_state"],
"suggested_amount": number | null,
"txn_id": string | null
            }
                          SetofOptions: {
        from: "*"
        to: "home_cards"
        isOneToOne: true
        isSetofReturn: false
      } },
"next_notice":
{ Args: { "p_member": string }; Returns: {
              "answered_at": string | null,
"body": string,
"cls": Database["public"]['Enums']["card_class"],
"created_at": string,
"expires_at": string | null,
"headline": string,
"id": string,
"kind": string | null,
"member_id": string,
"payload": NonNullable<Json>,
"proposal_id": string | null,
"shown_at": string | null,
"state": Database["public"]['Enums']["card_state"],
"suggested_amount": number | null,
"txn_id": string | null
            }
                          SetofOptions: {
        from: "*"
        to: "home_cards"
        isOneToOne: true
        isSetofReturn: false
      } },
"nightly_sweep":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"notify_member":
{ Args: { "p_code": string,"p_in_app": string,"p_lock": string,"p_member": string,"p_payload"?: Json }; Returns: undefined
                           },
"nth_dow_of_month":
{ Args: { "p_dow": number,"p_month": number,"p_nth": number,"p_year": number }; Returns: string
                           },
"on_decline":
{ Args: { "p_auth": Json,"p_member": string,"p_txn": string }; Returns: undefined
                           },
"on_posted":
{ Args: { "p_member": string,"p_txn": string }; Returns: undefined
                           },
"open_member_accounts":
{ Args: { "p_member": string }; Returns: undefined
                           },
"peek_invite":
{ Args: { "p_token": string }; Returns: Json
                           },
"period_end":
{ Args: { "p_at"?: string,"p_period": Database["public"]['Enums']["budget_period"] }; Returns: string
                           },
"period_start":
{ Args: { "p_at"?: string,"p_period": Database["public"]['Enums']["budget_period"] }; Returns: string
                           },
"post_transaction":
{ Args: { "p_account": string,"p_amount": number,"p_at"?: string,"p_category"?: string,"p_mcc": string,"p_member": string,"p_merchant": string,"p_rail"?: string }; Returns: string
                           },
"predict_income":
{ Args: { "p_member": string }; Returns: undefined
                           },
"prior_banking_day":
{ Args: { "p_date": string }; Returns: string
                           },
"projected_first_moment_next_month":
{ Args: { "p_member": string }; Returns: number
                           },
"propose_block":
{ Args: { "p_kind": Database["public"]['Enums']["block_kind"],"p_label": string,"p_member": string,"p_target": string }; Returns: Json
                           },
"propose_block_removal":
{ Args: { "p_block": string }; Returns: Json
                           },
"propose_budget_change":
{ Args: { "p_amount": number,"p_line": string,"p_mode": Database["public"]['Enums']["budget_mode"],"p_period"?: Database["public"]['Enums']["budget_period"] }; Returns: Json
                           },
"propose_chat_action":
{ Args: { "p_action": Json,"p_body": string,"p_thread": string }; Returns: string
                           },
"propose_consent":
{ Args: { "p_body": string,"p_headline": string,"p_kind": Database["public"]['Enums']["consent_kind"],"p_member": string,"p_payload": Json }; Returns: string
                           },
"propose_level_change":
{ Args: { "p_level": number,"p_member": string }; Returns: Json
                           },
"raise_alert":
{ Args: { "p_code": string,"p_member": string,"p_payload"?: Json,"p_title"?: string }; Returns: undefined
                           },
"report_card_lost":
{ Args: { "p_member": string }; Returns: Json
                           },
"report_fraud":
{ Args: { "p_member": string,"p_txn_id": string }; Returns: Json
                           },
"resend_member_invite":
{ Args: { "p_link_id": string }; Returns: Json
                           },
"run_auto_move":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"run_housing_timer":
{ Args: { "p_member": string }; Returns: undefined
                           },
"run_repeating_transfers":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"run_ssi_sweep":
{ Args: { "p_force"?: boolean,"p_member": string }; Returns: undefined
                           },
"seed_federal_holidays":
{ Args: { "p_from": number,"p_to": number }; Returns: undefined
                           },
"send_chat_message":
{ Args: { "p_body"?: string,"p_kind"?: Database["public"]['Enums']["thread_kind"],"p_member": string,"p_txn_id"?: string }; Returns: string
                           },
"set_card_paused":
{ Args: { "p_member": string,"p_paused": boolean }; Returns: undefined
                           },
"simulate_deposit":
{ Args: { "p_amount": number,"p_at"?: string,"p_member": string,"p_source": string }; Returns: Json
                           },
"simulate_purchase":
{ Args: { "p_account"?: Database["public"]['Enums']["account_kind"],"p_amount": number,"p_at"?: string,"p_mcc": string,"p_member": string,"p_merchant": string }; Returns: Json
                           },
"spendable_balance":
{ Args: { "p_member": string }; Returns: number
                           },
"ssi_room":
{ Args: { "p_member": string }; Returns: number
                           },
"start_housing_timer":
{ Args: { "p_amount": number,"p_member": string,"p_payee": string }; Returns: undefined
                           },
"start_problem_report":
{ Args: { "p_member": string,"p_txn_id": string }; Returns: undefined
                           },
"test_add_money":
{ Args: { "p_amount": number,"p_kind": Database["public"]['Enums']["account_kind"],"p_member": string,"p_source"?: string }; Returns: Json
                           },
"test_guard":
{ Args: { "p_member": string }; Returns: undefined
                           },
"test_link_counterpart":
{ Args: { "p_level"?: number,"p_other": string }; Returns: Json
                           },
"test_reset_account":
{ Args: { "p_member": string }; Returns: Json
                           },
"test_run_scenario":
{ Args: { "p_code": string,"p_member": string }; Returns: Json
                           },
"transaction_questions_today":
{ Args: { "p_member": string }; Returns: number
                           },
"use_emergency_money":
{ Args: { "p_amount": number,"p_member": string }; Returns: Json
                           },
"verify_invite_dob":
{ Args: { "p_dob": string,"p_token": string }; Returns: Json
                           },
"withdraw_consent":
{ Args: { "p_consent": string }; Returns: undefined
                           }
          }
          Enums: {
            "account_kind": "checking"|"able"|"emergency"|"ebt"|"backpayment","alert_group": "card_safety"|"declines"|"limits"|"money"|"benefits"|"questions"|"setup","app_role": "member"|"navigator","block_kind": "merchant"|"category","block_status": "active"|"pending_add"|"pending_remove"|"ended","budget_mode": "guide"|"alert"|"stop","budget_period": "day"|"week"|"month","card_class": "ABLE_ANSWER"|"CONSENT"|"SENTINEL"|"QDE_OFFER"|"INCOME_TAG"|"NOTICE","card_state": "queued"|"shown"|"answered_yes"|"answered_no"|"dismissed"|"expired"|"withdrawn","card_status": "not_ordered"|"ordered"|"shipped"|"delivered"|"active"|"paused"|"lost"|"stolen"|"replaced","confidence": "LOW"|"MEDIUM"|"HIGH","consent_kind": "LEVEL_UP"|"LIMIT_CHANGE"|"BLOCK_ADD"|"BLOCK_REMOVE"|"GOAL_PROPOSAL"|"ABLE_ROLLOVER"|"SUCCESSOR"|"AUTO_MOVE"|"AI_HELPER_ON","consent_status": "pending"|"approved"|"declined"|"withdrawn"|"expired","dispute_kind": "fraud"|"other","dispute_status": "open"|"under_review"|"resolved"|"withdrawn","income_kind": "ssi"|"ssdi"|"wages"|"other","link_status": "invited"|"active"|"ended"|"locked"|"expired","msg_action_status": "pending"|"confirmed"|"declined"|"expired","msg_sender": "member"|"navigator"|"ai"|"system","notify_channel": "push"|"text"|"email"|"in_app","thread_kind": "help"|"navigator_private","transfer_status": "pending"|"completed"|"failed"|"scheduled","txn_status": "posted"|"declined"|"pending"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "account_kind": ["checking", "able", "emergency", "ebt", "backpayment"],"alert_group": ["card_safety", "declines", "limits", "money", "benefits", "questions", "setup"],"app_role": ["member", "navigator"],"block_kind": ["merchant", "category"],"block_status": ["active", "pending_add", "pending_remove", "ended"],"budget_mode": ["guide", "alert", "stop"],"budget_period": ["day", "week", "month"],"card_class": ["ABLE_ANSWER", "CONSENT", "SENTINEL", "QDE_OFFER", "INCOME_TAG", "NOTICE"],"card_state": ["queued", "shown", "answered_yes", "answered_no", "dismissed", "expired", "withdrawn"],"card_status": ["not_ordered", "ordered", "shipped", "delivered", "active", "paused", "lost", "stolen", "replaced"],"confidence": ["LOW", "MEDIUM", "HIGH"],"consent_kind": ["LEVEL_UP", "LIMIT_CHANGE", "BLOCK_ADD", "BLOCK_REMOVE", "GOAL_PROPOSAL", "ABLE_ROLLOVER", "SUCCESSOR", "AUTO_MOVE", "AI_HELPER_ON"],"consent_status": ["pending", "approved", "declined", "withdrawn", "expired"],"dispute_kind": ["fraud", "other"],"dispute_status": ["open", "under_review", "resolved", "withdrawn"],"income_kind": ["ssi", "ssdi", "wages", "other"],"link_status": ["invited", "active", "ended", "locked", "expired"],"msg_action_status": ["pending", "confirmed", "declined", "expired"],"msg_sender": ["member", "navigator", "ai", "system"],"notify_channel": ["push", "text", "email", "in_app"],"thread_kind": ["help", "navigator_private"],"transfer_status": ["pending", "completed", "failed", "scheduled"],"txn_status": ["posted", "declined", "pending"]
          }
        }
} as const

