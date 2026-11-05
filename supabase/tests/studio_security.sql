begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
insert into auth.users(id,email,raw_user_meta_data) values
 ('00000000-0000-4000-8000-00000000a001','backend-review-a@example.invalid','{"display_name":"Backend regression A"}'),
 ('00000000-0000-4000-8000-00000000a002','backend-review-b@example.invalid','{"display_name":"Backend regression B"}');
insert into public.merchant_profiles(id,user_id,restaurant_name) values
 ('00000000-0000-4000-8000-00000000b001','00000000-0000-4000-8000-00000000a001','Backend regression A'),
 ('00000000-0000-4000-8000-00000000b002','00000000-0000-4000-8000-00000000a002','Backend regression B');
insert into public.ai_agent_logs(merchant_id,agent_name,action_type) values
 ('00000000-0000-4000-8000-00000000b001','menu-analyzer','regression'),
 ('00000000-0000-4000-8000-00000000b002','campaign-generator','regression');
insert into public.ai_campaigns(merchant_id,campaign_title) values
 ('00000000-0000-4000-8000-00000000b001','Backend regression A'),
 ('00000000-0000-4000-8000-00000000b002','Backend regression B');
insert into public.merchant_payments(merchant_id,amount_cents,currency,payment_provider,payment_status,verified_at) values
 ('00000000-0000-4000-8000-00000000b001',1599,'USD','manual','succeeded',now()),
 ('00000000-0000-4000-8000-00000000b001',1200,'USD','manual','pending',null),
 ('00000000-0000-4000-8000-00000000b001',800,'USD','manual','succeeded',null),
 ('00000000-0000-4000-8000-00000000b001',999,'EUR','manual','succeeded',now()),
 ('00000000-0000-4000-8000-00000000b002',9000,'USD','manual','succeeded',now());
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-00000000a001","role":"authenticated"}',true);
do $$
declare evidence jsonb; blocked boolean; changed integer;
begin
 evidence := public.get_studio_evidence();
 if (evidence #>> '{revenue,total_cents}')::integer <> 1599 then raise exception 'Verified USD revenue scope failed'; end if;
 if (evidence #>> '{revenue,succeeded_count}')::integer <> 1 then raise exception 'Verified count failed'; end if;
 if (evidence #>> '{totals,agent_runs}')::integer <> 1 then raise exception 'Agent logs cross-owner leak'; end if;
 if jsonb_array_length(evidence->'latest_merchants') <> 1 or evidence #>> '{latest_merchants,0,restaurant_name}' <> 'Backend regression A' then raise exception 'Merchant scope failed'; end if;
 if jsonb_array_length(evidence->'latest_campaigns') <> 1 then raise exception 'Campaign scope failed'; end if;
 blocked := false;
 begin
  insert into public.merchant_payments(merchant_id,amount_cents,payment_provider,payment_status) values ('00000000-0000-4000-8000-00000000b001',100,'manual','succeeded');
 exception when insufficient_privilege then blocked := true; end;
 if not blocked then raise exception 'Client can self-certify succeeded payment'; end if;
 blocked := false;
 begin
  insert into public.merchant_payments(merchant_id,amount_cents,payment_provider,payment_status,verified_at) values ('00000000-0000-4000-8000-00000000b001',100,'manual','pending',now());
 exception when insufficient_privilege then blocked := true; end;
 if not blocked then raise exception 'Client can set verified_at'; end if;
 blocked := false;
 begin
  insert into public.merchant_payments(merchant_id,amount_cents,payment_provider,payment_status) values ('00000000-0000-4000-8000-00000000b002',100,'manual','pending');
 exception when insufficient_privilege then blocked := true; end;
 if not blocked then raise exception 'Client can write another merchant payment'; end if;
 insert into public.merchant_payments(merchant_id,amount_cents,payment_provider,payment_status) values ('00000000-0000-4000-8000-00000000b001',100,'manual','pending');
 update public.merchant_payments set payment_status='succeeded',verified_at=now() where merchant_id='00000000-0000-4000-8000-00000000b001' and payment_status='pending';
 get diagnostics changed = row_count;
 if changed <> 0 then raise exception 'Client can update payment verification'; end if;
end $$;
set local role anon;
do $$
declare blocked boolean := false;
begin
 begin perform public.get_studio_evidence(); exception when insufficient_privilege then blocked := true; end;
 if not blocked then raise exception 'Anonymous caller can execute evidence RPC'; end if;
end $$;
reset role;
rollback;
select jsonb_build_object('result','PASS','cross_merchant_isolation',true,'verified_usd_revenue',true,'self_verification_rejected',true,'pending_write_allowed',true,'anonymous_rpc_rejected',true,'fixtures_cleaned',not exists(select 1 from auth.users where id in ('00000000-0000-4000-8000-00000000a001','00000000-0000-4000-8000-00000000a002'))) as regression_result;
