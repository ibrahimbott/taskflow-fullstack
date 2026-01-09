import { Task } from '../types/task'
import TaskItem from './TaskItem'

interface TaskListProps {
  tasks: Task[]
  onUpdateTask: (task: Task) => void
  onDeleteTask: (id: string) => void
  onToggleCompletion: (id: string) => void
}

export default function TaskList({
  tasks,
  onUpdateTask,
  onDeleteTask,
  onToggleCompletion
}: TaskListProps) {
  if (tasks.length === 0) {
    return null; // Parent handles empty state now
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onUpdate={onUpdateTask}
          onDelete={onDeleteTask}
          onToggleCompletion={onToggleCompletion}
        />
      ))}
    </div>
  )
}