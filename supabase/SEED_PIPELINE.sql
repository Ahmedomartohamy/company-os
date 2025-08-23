-- Pipeline Seed Data for Manual Testing
-- This file creates a default sales pipeline with standard stages
-- Run this AFTER the main migration has been executed

DO $$
DECLARE
    p_id uuid;
BEGIN
    -- Create default pipeline
    INSERT INTO public.pipelines(name) VALUES ('Default Sales') RETURNING id INTO p_id;
    
    -- Create stages for the pipeline
    INSERT INTO public.stages(pipeline_id, name, position, probability) VALUES 
        (p_id, 'Qualification', 1, 10),
        (p_id, 'Needs Analysis', 2, 30),
        (p_id, 'Proposal', 3, 60),
        (p_id, 'Negotiation', 4, 90);
    
    RAISE NOTICE 'Pipeline "Default Sales" created with ID: %', p_id;
    RAISE NOTICE 'Created 4 stages: Qualification (10%%), Needs Analysis (30%%), Proposal (60%%), Negotiation (90%%)';
END $$;