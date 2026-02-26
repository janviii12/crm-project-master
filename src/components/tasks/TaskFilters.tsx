import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Filter,
  X,
  Search,
  Calendar,
  User,
  Tag,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  roles?: string[];
}

interface TaskFiltersProps {
  users: User[];
  onFiltersChange: (filters: TaskFilters) => void;
  initialFilters?: TaskFilters;
}

export interface TaskFilters {
  search: string;
  status: string[];
  priority: string[];
  category: string[];
  assignedTo: string[];
  dateRange: {
    start: string;
    end: string;
  };
  overdue: boolean;
}

const TaskFilters: React.FC<TaskFiltersProps> = ({
  users,
  onFiltersChange,
  initialFilters
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<TaskFilters>(
    initialFilters || {
      search: '',
      status: [],
      priority: [],
      category: [],
      assignedTo: [],
      dateRange: { start: '', end: '' },
      overdue: false
    }
  );

  const updateFilters = (newFilters: Partial<TaskFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const clearFilters = () => {
    const clearedFilters: TaskFilters = {
      search: '',
      status: [],
      priority: [],
      category: [],
      assignedTo: [],
      dateRange: { start: '', end: '' },
      overdue: false
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const toggleArrayFilter = (key: keyof TaskFilters, value: string) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFilters({ [key]: newArray });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status.length > 0) count++;
    if (filters.priority.length > 0) count++;
    if (filters.category.length > 0) count++;
    if (filters.assignedTo.length > 0) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.overdue) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <CardTitle className="text-lg">Filters</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm">
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>
      </CardHeader>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Search */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search Tasks
              </Label>
              <Input
                placeholder="Search by title, description, or category..."
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Status Filter */}
              <div className="space-y-3">
                <Label>Status</Label>
                <div className="space-y-2">
                  {['pending', 'in-progress', 'blocked', 'completed'].map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={filters.status.includes(status)}
                        onCheckedChange={() => toggleArrayFilter('status', status)}
                      />
                      <Label
                        htmlFor={`status-${status}`}
                        className="text-sm font-normal capitalize cursor-pointer"
                      >
                        {status.replace('-', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority Filter */}
              <div className="space-y-3">
                <Label>Priority</Label>
                <div className="space-y-2">
                  {['low', 'medium', 'high'].map((priority) => (
                    <div key={priority} className="flex items-center space-x-2">
                      <Checkbox
                        id={`priority-${priority}`}
                        checked={filters.priority.includes(priority)}
                        onCheckedChange={() => toggleArrayFilter('priority', priority)}
                      />
                      <Label
                        htmlFor={`priority-${priority}`}
                        className="text-sm font-normal capitalize cursor-pointer"
                      >
                        {priority}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assigned To Filter */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Assigned To (Executives)
                </Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {users.filter(user => user.roles && user.roles.includes('executive')).map((user) => (
                    <div key={user._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`assigned-${user._id}`}
                        checked={filters.assignedTo.includes(user._id)}
                        onCheckedChange={() => toggleArrayFilter('assignedTo', user._id)}
                      />
                      <Label
                        htmlFor={`assigned-${user._id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {user.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Due Date Range
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date" className="text-xs text-muted-foreground">From</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => updateFilters({
                      dateRange: { ...filters.dateRange, start: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date" className="text-xs text-muted-foreground">To</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => updateFilters({
                      dateRange: { ...filters.dateRange, end: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Overdue Filter */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="overdue"
                checked={filters.overdue}
                onCheckedChange={(checked) => updateFilters({ overdue: checked as boolean })}
              />
              <Label htmlFor="overdue" className="text-sm font-normal cursor-pointer">
                Show only overdue tasks
              </Label>
            </div>

            {/* Quick Filters */}
            <div className="space-y-3">
              <Label>Quick Filters</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilters({
                    status: ['pending', 'in-progress'],
                    overdue: false
                  })}
                >
                  My Active Tasks
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilters({
                    priority: ['high'],
                    overdue: false
                  })}
                >
                  High Priority
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilters({
                    overdue: true
                  })}
                >
                  Overdue
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilters({
                    status: ['completed']
                  })}
                >
                  Completed
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default TaskFilters;
