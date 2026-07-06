-- DropIndex
DROP INDEX "influencers_company_id_archived_at_idx";

-- RenameIndex
ALTER INDEX "influencer_timeline_events_company_id_influencer_id_created_at_" RENAME TO "influencer_timeline_events_company_id_influencer_id_created_idx";
