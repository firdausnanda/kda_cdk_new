<?php
namespace App\Actions;

use App\Contracts\Workflowable;
use App\Enums\WorkflowAction;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class BulkWorkflowAction
{
  public function execute(
    Workflowable|string $model,
    WorkflowAction $action,
    array $ids,
    User $user,
    array $extraData = []
  ): int {
    $modelClass = is_string($model) ? $model : get_class($model);
    $workflow = $modelClass::workflowMap()[$action->value] ?? [];
    $totalCount = 0;
    $isAdmin = $user->hasRole('admin');

    $processedIds = [];

    foreach ($workflow as $role => $rule) {
      if (!$user->hasRole($role) && !$isAdmin) {
        continue;
      }

      // Filter query to only include IDs that haven't been processed yet
      // We re-instantiate the query because we need a fresh builder
      $query = $modelClass::baseQuery($ids);

      if (!empty($processedIds)) {
        $query->whereNotIn('id', $processedIds);
      }

      if (isset($rule['from'])) {
        if (is_array($rule['from'])) {
          $query->whereIn('status', $rule['from']);
        } else {
          $query->where('status', $rule['from']);
        }
      }

      if (!empty($rule['delete'])) {
        // For delete, we might not need to track IDs if we just want to count them,
        // but to be safe and consistent:
        $idsToDelete = $query->pluck('id')->toArray();
        if (empty($idsToDelete))
          continue;

        $modelClass::whereIn('id', $idsToDelete)->delete();
        $processedIds = array_merge($processedIds, $idsToDelete);
        $totalCount += count($idsToDelete);
        continue;
      }

      $update = [
        'status' => $rule['to'] ?? 'rejected',
      ];

      if (!empty($rule['timestamp'])) {
        $update[$rule['timestamp']] = now();
      }

      // Get IDs that will be updated to exclude them from next iterations
      $idsToUpdate = $query->pluck('id')->toArray();

      if (empty($idsToUpdate)) {
        continue;
      }

      $modelClass::whereIn('id', $idsToUpdate)->update(array_merge($update, $extraData));

      $processedIds = array_merge($processedIds, $idsToUpdate);
      $totalCount += count($idsToUpdate);
    }

    return $totalCount;
  }
}