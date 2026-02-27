'use client';

import { useState, useRef, useEffect } from 'react';
import './home.css';

import useSWR from 'swr';

interface Task {
  id: string;
  text: string;
  assignees: string[];
  completed: boolean;
  createdAt: number;
}



// SWR Fetcher
const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Home() {
  const { data: tasks, error, mutate } = useSWR<Task[]>('/api/tasks', fetcher, {
    refreshInterval: 1000, // Poll every 1s for "real-time" feel
    revalidateOnFocus: true,
  });

  const { data: availableAssignees, mutate: mutateAssignees } = useSWR<string[]>('/api/assignees', fetcher, {
    refreshInterval: 2000,
  });

  const [newTaskText, setNewTaskText] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [newAssigneeName, setNewAssigneeName] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAssigneeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const payload = {
      text: newTaskText.trim(),
      assignees: [...selectedAssignees]
    };

    // Optimistic Update
    const optimisticTask: Task = {
      id: crypto.randomUUID(),
      completed: false,
      createdAt: Date.now(),
      ...payload
    };

    mutate(tasks ? [optimisticTask, ...tasks] : [optimisticTask], false);

    setNewTaskText('');
    setSelectedAssignees([]);
    setIsAssigneeDropdownOpen(false);

    // Actual Request
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    mutate(); // re-fetch to sync exact backend state
  };

  const handleAddAssignee = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!newAssigneeName.trim()) return;

    const newName = newAssigneeName.trim();

    // Optimistic Update
    mutateAssignees(availableAssignees ? [...availableAssignees, newName] : [newName], false);
    setNewAssigneeName('');

    await fetch('/api/assignees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName })
    });

    mutateAssignees();
  };

  const toggleTaskCompletion = async (id: string, currentStatus: boolean) => {
    // Optimistic Update
    mutate(
      tasks?.map(t => t.id === id ? { ...t, completed: !currentStatus } : t),
      false
    );

    await fetch('/api/tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, completed: !currentStatus })
    });

    mutate();
  };

  const deleteTask = async (id: string) => {
    // Optimistic Update
    mutate(tasks?.filter(t => t.id !== id), false);

    await fetch(`/api/tasks?id=${id}`, {
      method: 'DELETE'
    });

    mutate();
  };

  const toggleAssignee = (assignee: string) => {
    setSelectedAssignees(prev =>
      prev.includes(assignee)
        ? prev.filter(a => a !== assignee)
        : [...prev, assignee]
    );
  };

  if (error) return <div className="app-container"><p style={{ color: 'red' }}>Failed to load tasks</p></div>;
  if (!tasks) return <div className="app-container"><p>Loading tasks...</p></div>;

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  const renderTaskCard = (task: Task, index: number) => (
    <div
      key={task.id}
      className={`task-card animate-slide-up ${task.completed ? 'completed' : ''}`}
      style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
    >
      <div className="task-card-header">
        <button
          className="task-checkbox"
          onClick={() => toggleTaskCompletion(task.id, task.completed)}
          aria-label="Toggle completion"
        >
          <div className="check-indicator"></div>
        </button>
        <button
          className="delete-btn"
          onClick={() => deleteTask(task.id)}
          aria-label="Delete task"
        >
          ✕
        </button>
      </div>

      <div className="task-card-body">
        <p className="task-text">{task.text}</p>
      </div>

      <div className="task-card-footer">
        {task.assignees.length > 0 ? (
          <div className="task-assignees">
            {task.assignees.map(a => (
              <div key={a} className="assignee-avatar" title={a}>
                {a.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        ) : (
          <span className="unassigned-text">Unassigned</span>
        )}
      </div>
    </div>
  );

  return (
    <main className="app-container">
      <header className="app-header animate-slide-up">
        <h1 className="title">Focus.</h1>
        <p className="subtitle">Delegate and conquer.</p>
      </header>

      <section className="input-section animate-slide-up" style={{ animationDelay: '100ms' }}>
        <form onSubmit={handleAddTask} className="task-form">
          <input
            type="text"
            className="task-input"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="What needs to be done?"
            autoComplete="off"
            maxLength={120}
          />

          <div className="form-actions">
            <div className="assignee-selector" ref={dropdownRef}>
              <button
                type="button"
                className={`assignee-trigger ${selectedAssignees.length > 0 ? 'has-selection' : ''}`}
                onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
              >
                {selectedAssignees.length > 0
                  ? `${selectedAssignees.length} assigned`
                  : 'Assign'}
                <span className="chevron">▼</span>
              </button>

              {isAssigneeDropdownOpen && (
                <div className="assignee-dropdown animate-fade-in">
                  <div className="assignee-add-form">
                    <input
                      type="text"
                      placeholder="New user..."
                      value={newAssigneeName}
                      onChange={e => setNewAssigneeName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddAssignee(e)}
                    />
                    <button type="button" onClick={handleAddAssignee}>+</button>
                  </div>

                  {availableAssignees?.map(person => (
                    <label key={person} className="assignee-option">
                      <input
                        type="checkbox"
                        checked={selectedAssignees.includes(person)}
                        onChange={() => toggleAssignee(person)}
                      />
                      <span className="assignee-name">{person}</span>
                      <div className="checkbox-custom"></div>
                    </label>
                  ))}

                  {availableAssignees?.length === 0 && (
                    <div style={{ padding: '8px', color: 'var(--text-tertiary)', fontSize: '0.8rem', textAlign: 'center' }}>
                      No users yet
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={!newTaskText.trim()}
            >
              Add Task
            </button>
          </div>
        </form>
      </section>

      <section className="tasks-section" style={{ animationDelay: '200ms' }}>
        <div className="tasks-grid">
          {tasks.length === 0 ? (
            <div className="empty-state animate-fade-in">
              <p>No tasks yet. The void awaits.</p>
            </div>
          ) : (
            activeTasks.map((task, index) => renderTaskCard(task, index))
          )}
        </div>

        {completedTasks.length > 0 && (
          <div className="completed-group animate-slide-up">
            <hr className="completed-divider" />
            <h2 className="completed-title">Completed Tasks</h2>
            <div className="tasks-grid">
              {completedTasks.map((task, index) => renderTaskCard(task, index))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
