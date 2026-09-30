-- The default argument on the new run_ssi_sweep made the old single-argument
-- version ambiguous. Drop it.
drop function if exists run_ssi_sweep(uuid);
