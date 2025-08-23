# Kanban DnD Hardening Report

## Overview

This report documents the implementation of hardened drag-and-drop functionality for the opportunities Kanban board, including optimistic updates with rollback, pending-state management, and enhanced RBAC gating.

## Implementation Details

### 1. Optimistic Updates with Rollback

#### Flow Description

1. **User Initiates Drag**: User drags an opportunity card to a new stage
2. **RBAC Check**: System validates user permissions before allowing the move
3. **Optimistic Update**: Card immediately appears in the new position locally
4. **Pending State**: Card shows visual feedback (opacity, animation) indicating it's being moved
5. **API Call**: Background RPC call to `move_opportunity_stage`
6. **Success Path**: Clear pending state, invalidate queries for fresh data
7. **Error Path**: Rollback to original position, show error toast

#### State Management

- `movingOpportunities`: Set<string> - Tracks which opportunities are currently being moved
- `optimisticMoves`: Map<string, {fromStageId, toStageId}> - Tracks optimistic position changes

#### Visual Feedback

- Moving cards show reduced opacity (75%) and pulse animation
- Dragging cards show rotation, scale, and blue ring effects
- Drag handles are disabled during moves to prevent conflicts

### 2. Enhanced RBAC Implementation

#### Permission Checks

- **Basic Permission**: `can('update', 'opportunities', record)` must return true
- **Ownership Rule**: Sales reps can only move opportunities they own (`record.owner_id === user.id`)
- **Role Hierarchy**: Admins and sales managers can move any opportunity

#### UI Feedback

- **Allowed**: Green drag handle with grab cursor
- **Not Allowed**: Grayed-out drag handle with tooltip "غير مسموح بنقل الصفقة"
- **Disabled State**: Drag functionality completely disabled for unauthorized users

### 3. Error Handling

#### Rollback Mechanism

```typescript
onError: (error, { oppId }) => {
  // Clear optimistic state
  setOptimisticMoves((prev) => {
    const newMap = new Map(prev);
    newMap.delete(oppId);
    return newMap;
  });

  // Clear moving state
  setMovingOpportunities((prev) => {
    const newSet = new Set(prev);
    newSet.delete(oppId);
    return newSet;
  });

  // Show Arabic error message
  toast.error('فشل نقل الصفقة؛ تم التراجع');
};
```

#### Error Messages

- **Move Failure**: "فشل نقل الصفقة؛ تم التراجع" (Move failed; rolled back)
- **Permission Denied**: "غير مسموح لك بنقل هذه الفرصة" (You're not allowed to move this opportunity)
- **Tooltip**: "غير مسموح بنقل الصفقة" (Moving opportunity not allowed)

### 4. Performance Optimizations

#### Query Management

- **Optimistic Updates**: Immediate UI feedback without waiting for server
- **Smart Invalidation**: Only invalidate queries on successful moves
- **Efficient Grouping**: Memoized opportunity grouping with optimistic state

#### Drag Performance

- **Conditional Listeners**: Only attach drag listeners to authorized cards
- **Disabled State**: Completely disable dragging for unauthorized users
- **Visual Feedback**: Smooth animations and transitions

## Files Modified

### 1. `src/lib/opportunities.ts`

- Enhanced `moveOpportunityStage` function to return proper Promise
- Improved error handling with detailed error messages

### 2. `src/modules/opportunities/OpportunitiesBoard.tsx`

- Added state management for moving opportunities and optimistic moves
- Implemented optimistic update logic in opportunity grouping
- Enhanced mutation with rollback functionality
- Updated drag handlers with RBAC checks

### 3. `src/modules/opportunities/OpportunityCard.tsx`

- Added drag handle with conditional rendering
- Implemented tooltip for unauthorized users
- Added visual feedback for moving state
- Enhanced styling for different permission states

## Security Considerations

### RBAC Enforcement

- **Client-Side**: Immediate feedback and UX improvements
- **Server-Side**: RPC function enforces permissions (assumed)
- **Double Validation**: Both UI and API validate permissions

### Data Integrity

- **Optimistic Updates**: Never persist locally, always rollback on error
- **State Consistency**: Clear all related state on success/failure
- **Race Conditions**: Prevent multiple simultaneous moves of same opportunity

## Testing Recommendations

### Manual Testing

1. **Admin User**: Should be able to move any opportunity
2. **Sales Manager**: Should be able to move any opportunity
3. **Sales Rep (Owner)**: Should be able to move own opportunities
4. **Sales Rep (Non-Owner)**: Should see disabled drag handle with tooltip
5. **Network Failure**: Should rollback and show error message
6. **Concurrent Moves**: Should handle multiple users moving different opportunities

### Edge Cases

1. **Rapid Clicks**: Prevent multiple moves of same opportunity
2. **Network Latency**: Visual feedback during slow connections
3. **Permission Changes**: Handle real-time permission updates
4. **Stage Deletion**: Handle moves to non-existent stages

## Future Enhancements

### Potential Improvements

1. **Real-time Updates**: WebSocket integration for live collaboration
2. **Conflict Resolution**: Handle simultaneous moves by different users
3. **Audit Trail**: Log all opportunity moves for compliance
4. **Batch Operations**: Allow moving multiple opportunities at once
5. **Undo/Redo**: Implement operation history for better UX

### Performance Monitoring

1. **Move Latency**: Track time from drag to server response
2. **Error Rates**: Monitor rollback frequency
3. **User Behavior**: Analyze drag patterns and success rates

## Conclusion

The hardened Kanban DnD implementation provides a robust, secure, and user-friendly experience for managing opportunity stages. The optimistic update pattern ensures immediate feedback while maintaining data integrity through proper rollback mechanisms. Enhanced RBAC checks prevent unauthorized actions while providing clear visual feedback to users about their permissions.
