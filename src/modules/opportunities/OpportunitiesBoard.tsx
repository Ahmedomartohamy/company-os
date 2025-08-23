import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { 
  getPipeline, 
  moveOpportunityStage, 
  OpportunityWithDetails,
  Stage,
  Pipeline 
} from '@/lib/opportunities';
import { useAuthz } from '@/lib/useAuthz';
import Modal from '@/components/ui/Modal';
import OpportunityCard from './OpportunityCard';
import { OpportunityForm } from './OpportunityForm';

interface StageColumnProps {
  stage: Stage;
  opportunities: OpportunityWithDetails[];
  onEditOpportunity?: (opportunity: OpportunityWithDetails) => void;
  onDeleteOpportunity?: (id: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  movingOpportunities: Set<string>;
}

function StageColumn({ 
  stage, 
  opportunities, 
  onEditOpportunity, 
  onDeleteOpportunity,
  onLoadMore,
  hasMore,
  isLoading,
  movingOpportunities
}: StageColumnProps) {
  const { can } = useAuthz();
  const canCreate = can('create', 'opportunities');

  return (
    <div className="bg-gray-50 rounded-lg p-4 min-h-[600px] w-80 flex-shrink-0">
      {/* Stage Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">{stage.name}</h3>
          <p className="text-sm text-gray-500">
            {opportunities.length} فرصة • {stage.probability}% احتمالية
          </p>
        </div>
        
        {canCreate && (
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-md transition-colors">
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Opportunities List */}
      <SortableContext 
        items={opportunities.map(opp => opp.id!)} 
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {opportunities.map((opportunity) => {
            const isMoving = movingOpportunities.has(opportunity.id!);
            const canMove = can('update', 'opportunities', opportunity);
            
            return (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                onEdit={onEditOpportunity}
                onDelete={onDeleteOpportunity}
                isMoving={isMoving}
                canMove={canMove}
              />
            );
          })}
        </div>
      </SortableContext>

      {/* Load More Button */}
      {hasMore && opportunities.length > 0 && (
        <div className="mt-4">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="w-full py-2 px-4 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                جاري التحميل...
              </>
            ) : (
              'عرض المزيد'
            )}
          </button>
        </div>
      )}

      {/* Empty State */}
      {opportunities.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-sm">لا توجد فرص في هذه المرحلة</div>
          {canCreate && (
            <button className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
              إضافة فرصة جديدة
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function OpportunitiesBoard() {
  const { pipelineId } = useParams<{ pipelineId: string }>();
  const queryClient = useQueryClient();
  const { can } = useAuthz();
  
  const [activeOpportunity, setActiveOpportunity] = useState<OpportunityWithDetails | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [movingOpportunities, setMovingOpportunities] = useState<Set<string>>(new Set());
  const [optimisticMoves, setOptimisticMoves] = useState<Map<string, { fromStageId: string; toStageId: string }>>(new Map());
  const [page, setPage] = useState(1);
  const [allOpportunities, setAllOpportunities] = useState<Map<string, OpportunityWithDetails[]>>(new Map());

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch pipeline data
  const { 
    data: pipeline, 
    isLoading, 
    error 
  } = useQuery<Pipeline | null>({
    queryKey: ['pipeline', pipelineId, page],
    queryFn: () => getPipeline(pipelineId!, page, 25),
    enabled: !!pipelineId
  });

  // Handle data updates when pipeline data changes
  React.useEffect(() => {
    if (pipeline?.stages) {
      setAllOpportunities(prev => {
        const newMap = new Map(prev);
        (pipeline as unknown as Pipeline).stages.forEach((stage: Stage & { opportunities?: OpportunityWithDetails[] }) => {
          const stageId = stage.id;
          const existingOpps = page === 1 ? [] : (newMap.get(stageId) || []);
          const newOpps = stage.opportunities || [];
          newMap.set(stageId, [...existingOpps, ...newOpps]);
        });
        return newMap;
      });
    }
  }, [pipeline, page]);

  // Mutation for moving opportunities with optimistic updates
  const moveOpportunityMutation = useMutation({
    mutationFn: ({ oppId, stageId }: { oppId: string; stageId: string }) => 
      moveOpportunityStage(oppId, stageId),
    onSuccess: (_, { oppId }) => {
      // Clear moving state and optimistic move
      setMovingOpportunities(prev => {
        const newSet = new Set(prev);
        newSet.delete(oppId);
        return newSet;
      });
      setOptimisticMoves(prev => {
        const newMap = new Map(prev);
        newMap.delete(oppId);
        return newMap;
      });
      // Invalidate queries to get fresh data
      queryClient.invalidateQueries({ queryKey: ['opportunities', pipelineId] });
    },
    onError: (error, { oppId }) => {
      console.error('Error moving opportunity:', error);
      // Rollback optimistic move
      setOptimisticMoves(prev => {
        const newMap = new Map(prev);
        newMap.delete(oppId);
        return newMap;
      });
      setMovingOpportunities(prev => {
        const newSet = new Set(prev);
        newSet.delete(oppId);
        return newSet;
      });
      toast.error('فشل نقل الصفقة؛ تم التراجع');
    }
  });

  // Group opportunities by stage with optimistic moves
  const stagesWithOpportunities = useMemo(() => {
    if (!(pipeline as unknown as Pipeline)?.stages) return [];
    
    return (pipeline as unknown as Pipeline).stages.map((stage: Stage) => {
      const stageOpportunities = allOpportunities.get(stage.id) || [];
      
      // Apply optimistic moves
      const adjustedOpportunities = stageOpportunities.filter(opp => {
        const optimisticMove = optimisticMoves.get(opp.id!);
        return !optimisticMove || optimisticMove.toStageId === stage.id;
      });
      
      // Add opportunities moved to this stage
      const movedToThisStage = (pipeline as unknown as Pipeline).stages
        .filter((s: Stage) => s.id !== stage.id)
        .flatMap((s: Stage) => allOpportunities.get(s.id) || [])
        .filter((opp: OpportunityWithDetails) => {
          const optimisticMove = optimisticMoves.get(opp.id!);
          return optimisticMove && optimisticMove.toStageId === stage.id;
        });
      
      return {
        ...stage,
        opportunities: [...adjustedOpportunities, ...movedToThisStage]
      };
    });
  }, [pipeline, allOpportunities, optimisticMoves]);

  // Reset pagination when pipeline changes
  const resetPagination = () => {
    setPage(1);
    setAllOpportunities(new Map());
  };

  // Load more opportunities
  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  // Check if there are more opportunities to load
  const hasMore = (pipeline as unknown as Pipeline)?.stages.some((stage: Stage) => {
    const currentOpps = allOpportunities.get(stage.id) || [];
    const latestOpps = stage.opportunities || [];
    return latestOpps.length === 25; // If we got exactly 25, there might be more
  }) || false;

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    
    // Find the opportunity being dragged
    const opportunity = stagesWithOpportunities
      .flatMap((stage: Stage & { opportunities: OpportunityWithDetails[] }) => stage.opportunities)
      .find((opp: OpportunityWithDetails) => opp.id === active.id);
    
    if (opportunity) {
      setActiveOpportunity(opportunity);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveOpportunity(null);
    
    if (!over || active.id === over.id) return;
    
    const opportunityId = active.id as string;
    const newStageId = over.id as string;
    
    // Find the opportunity being moved
    const opportunity = stagesWithOpportunities
      .flatMap((stage: Stage & { opportunities: OpportunityWithDetails[] }) => stage.opportunities)
      .find((opp: OpportunityWithDetails) => opp.id === opportunityId);
    
    if (!opportunity) return;
    
    // Check if user can move this opportunity (enhanced RBAC)
    if (!can('update', 'opportunities', opportunity)) {
      toast.error('غير مسموح لك بنقل هذه الفرصة');
      return;
    }
    
    const currentStageId = opportunity.stage_id;
    if (currentStageId === newStageId) return;
    
    // Apply optimistic update
    setOptimisticMoves(prev => {
      const newMap = new Map(prev);
      newMap.set(opportunityId, { fromStageId: currentStageId, toStageId: newStageId });
      return newMap;
    });
    
    // Set moving state
    setMovingOpportunities(prev => {
      const newSet = new Set(prev);
      newSet.add(opportunityId);
      return newSet;
    });
    
    // Execute the move
    moveOpportunityMutation.mutate({
      oppId: opportunityId,
      stageId: newStageId
    });
  };

  const handleEditOpportunity = (opportunity: OpportunityWithDetails) => {
    // TODO: Open edit modal
    console.log('Edit opportunity:', opportunity);
    toast.info('وظيفة التعديل قيد التطوير');
  };

  const handleDeleteOpportunity = (id: string) => {
    // TODO: Implement delete with confirmation
    console.log('Delete opportunity:', id);
    toast.info('وظيفة الحذف قيد التطوير');
  };

  if (!pipelineId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">معرف خط الأنابيب مفقود</h3>
          <p className="text-gray-600">يرجى التأكد من صحة الرابط</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">جاري تحميل خط الأنابيب...</p>
        </div>
      </div>
    );
  }

  if (error || !pipeline) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">خطأ في تحميل البيانات</h3>
          <p className="text-gray-600">تعذر تحميل خط الأنابيب. يرجى المحاولة مرة أخرى.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{(pipeline as unknown as Pipeline)?.name}</h1>
            <p className="text-gray-600 mt-1">
              {stagesWithOpportunities.reduce((total: number, stage: Stage & { opportunities: OpportunityWithDetails[] }) => total + stage.opportunities.length, 0)} فرصة تجارية
            </p>
          </div>
          
          {can('create', 'opportunities') && (
            <button 
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة فرصة
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 min-w-max">
            {stagesWithOpportunities.map((stage: Stage & { opportunities: OpportunityWithDetails[] }) => (
              <StageColumn
                key={stage.id}
                stage={stage}
                opportunities={stage.opportunities}
                onEditOpportunity={handleEditOpportunity}
                onDeleteOpportunity={handleDeleteOpportunity}
                onLoadMore={loadMore}
                hasMore={hasMore}
                isLoading={isLoading}
                movingOpportunities={movingOpportunities}
              />
            ))}
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeOpportunity && (
              <OpportunityCard
                opportunity={activeOpportunity}
                isDragging
              />
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Loading Overlay */}
      {moveOpportunityMutation.isPending && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600 ml-3" />
            <span className="text-gray-900">جاري نقل الفرصة...</span>
          </div>
        </div>
      )}

      {/* Create Opportunity Modal */}
      <Modal
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="إضافة فرصة جديدة"
      >
        <OpportunityForm
          stages={(pipeline as unknown as Pipeline)?.stages || []}
          onSuccess={() => setShowCreateForm(false)}
          onCancel={() => setShowCreateForm(false)}
        />
      </Modal>
    </div>
  );
}

export default OpportunitiesBoard;