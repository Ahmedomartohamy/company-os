import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { MoreVertical, DollarSign, Calendar, User, Building2, GripVertical } from 'lucide-react';
import { OpportunityWithDetails } from '@/lib/opportunities';
import { useAuthz } from '@/lib/useAuthz';
import { useAuth } from '@/app/auth/AuthProvider';

interface OpportunityCardProps {
  opportunity: OpportunityWithDetails;
  onEdit?: (opportunity: OpportunityWithDetails) => void;
  onDelete?: (id: string) => void;
  isDragging?: boolean;
  onClick?: () => void;
  isMoving?: boolean;
  canMove?: boolean;
}

export function OpportunityCard({ 
  opportunity, 
  onEdit, 
  onDelete, 
  isDragging = false,
  onClick,
  isMoving = false,
  canMove = false
}: OpportunityCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { can } = useAuthz();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ 
    id: opportunity.id!,
    disabled: !canMove || isMoving
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  const canUpdate = can('update', 'opportunities', opportunity);
  const canDelete = can('delete', 'opportunities', opportunity);
  const canView = can('view', 'opportunities', opportunity);

  const handleCardClick = () => {
    if (canView) {
      navigate(`/opportunities/${opportunity.id}`);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'غير محدد';
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'غير محدد';
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: ar });
    } catch {
      return 'تاريخ غير صحيح';
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'text-green-600 bg-green-50';
    if (probability >= 60) return 'text-blue-600 bg-blue-50';
    if (probability >= 40) return 'text-yellow-600 bg-yellow-50';
    if (probability >= 20) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleCardClick}
      className={`
        bg-white rounded-lg border border-gray-200 p-4 mb-3 shadow-sm hover:shadow-md transition-all duration-200 relative
        ${canView ? 'cursor-pointer' : 'cursor-default'}
        ${isDragging || isSortableDragging ? 'opacity-50 rotate-3 scale-105 shadow-lg ring-2 ring-blue-500 ring-opacity-50' : ''}
        ${isMoving ? 'opacity-75 animate-pulse' : ''}
      `}
    >
      {/* Drag Handle */}
      <div className="absolute top-2 right-2">
        {canMove ? (
          <div
            className="p-1 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        ) : (
          <div 
            className="p-1 cursor-not-allowed" 
            title="غير مسموح بنقل الصفقة"
          >
            <GripVertical className="h-4 w-4 text-gray-300" />
          </div>
        )}
      </div>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight flex-1 ml-2">
          {opportunity.name}
        </h3>
        
        {(canUpdate || canDelete) && (
          <div className="relative group">
            <button className="p-1 rounded-md hover:bg-gray-100 transition-colors">
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </button>
            
            {/* Dropdown Menu */}
            <div className="absolute left-0 top-8 w-32 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              {canUpdate && onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(opportunity);
                  }}
                  className="w-full text-right px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  تعديل
                </button>
              )}
              {canDelete && onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(opportunity.id!);
                  }}
                  className="w-full text-right px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  حذف
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Client */}
      {opportunity.client && (
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <Building2 className="h-4 w-4 ml-2 flex-shrink-0" />
          <span className="truncate">{opportunity.client.name}</span>
        </div>
      )}

      {/* Amount */}
      <div className="flex items-center text-sm text-gray-900 font-medium mb-2">
        <DollarSign className="h-4 w-4 ml-2 flex-shrink-0 text-green-600" />
        <span>{formatCurrency(opportunity.amount)}</span>
      </div>

      {/* Owner */}
      {opportunity.owner && (
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <User className="h-4 w-4 ml-2 flex-shrink-0" />
          <span className="truncate">{opportunity.owner.full_name}</span>
        </div>
      )}

      {/* Close Date */}
      <div className="flex items-center text-sm text-gray-600 mb-3">
        <Calendar className="h-4 w-4 ml-2 flex-shrink-0" />
        <span>{formatDate(opportunity.close_date)}</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        {/* Probability Badge */}
        <div className={`
          px-2 py-1 rounded-full text-xs font-medium
          ${getProbabilityColor(opportunity.probability)}
        `}>
          {opportunity.probability}%
        </div>

        {/* Stage Info */}
        {opportunity.stage && (
          <div className="text-xs text-gray-500">
            {opportunity.stage.name}
          </div>
        )}
      </div>

      {/* Notes Preview */}
      {opportunity.notes && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-600 line-clamp-2">
            {opportunity.notes}
          </p>
        </div>
      )}
    </div>
  );
}

export default OpportunityCard;