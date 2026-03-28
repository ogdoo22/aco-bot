import React, { useState, useEffect } from 'react';
import '../styles/Dashboard.css';

// This will be replaced with actual IPC calls
declare const window: any;

/**
 * Main dashboard showing tasks and live monitoring
 */
function Dashboard(): JSX.Element {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Task form state
  const [productUrl, setProductUrl] = useState('');
  const [productName, setProductName] = useState('');
  const [size, setSize] = useState('');

  useEffect(() => {
    loadTasks();

    // Listen for task updates
    if (window.electron) {
      window.electron.onTaskUpdate((data: any) => {
        console.log('Task update:', data);
        loadTasks();
      });
    }
  }, []);

  const loadTasks = async (): Promise<void> => {
    try {
      if (window.electron) {
        const allTasks = await window.electron.getAllTasks();
        setTasks(allTasks);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const createTask = async (): Promise<void> => {
    if (!productUrl || !productName || !size) {
      alert('Please fill all fields');
      return;
    }

    const task = {
      id: `task_${Date.now()}`,
      site: 'shopify',
      productUrl,
      productName,
      size,
      quantity: 1,
      profileId: 'default', // TODO: Select from profiles
      proxyId: null,
      mode: 'fast',
      status: 'idle',
      retryCount: 0,
      maxRetries: 3,
      delay: 500,
      orderNumber: null,
      errorMessage: null,
      checkoutTime: null,
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null,
    };

    try {
      if (window.electron) {
        await window.electron.createTask(task);
        setProductUrl('');
        setProductName('');
        setSize('');
        setIsCreatingTask(false);
        await loadTasks();
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task');
    }
  };

  const startTask = async (taskId: string): Promise<void> => {
    try {
      if (window.electron) {
        await window.electron.startTask(taskId);
        await loadTasks();
      }
    } catch (error) {
      console.error('Failed to start task:', error);
    }
  };

  const startAllTasks = async (): Promise<void> => {
    const idleTasks = tasks.filter((t) => t.status === 'idle').map((t) => t.id);
    if (idleTasks.length === 0) {
      alert('No idle tasks to start');
      return;
    }

    try {
      if (window.electron) {
        await window.electron.startMultipleTasks(idleTasks);
        await loadTasks();
      }
    } catch (error) {
      console.error('Failed to start tasks:', error);
    }
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    try {
      if (window.electron) {
        await window.electron.deleteTask(taskId);
        await loadTasks();
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const getStatusEmoji = (status: string): string => {
    const statusMap: Record<string, string> = {
      idle: '⏸️',
      running: '⚡',
      success: '✅',
      failed: '❌',
      retrying: '🔄',
    };
    return statusMap[status] || '⏸️';
  };

  const getStatusClass = (status: string): string => {
    return `status-${status}`;
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setIsCreatingTask(!isCreatingTask)}>
            {isCreatingTask ? 'Cancel' : '+ Create Task'}
          </button>
          {tasks.length > 0 && (
            <button className="btn btn-success" onClick={startAllTasks}>
              ▶️ Start All
            </button>
          )}
        </div>
      </div>

      {/* Task Creator */}
      {isCreatingTask && (
        <div className="task-creator">
          <h2>Create New Task</h2>
          <form onSubmit={(e) => { e.preventDefault(); createTask(); }}>
            <div className="form-group">
              <label>Product URL</label>
              <input
                type="url"
                placeholder="https://store.com/products/sneaker"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Product Name</label>
              <input
                type="text"
                placeholder="Air Jordan 1 Chicago"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Size</label>
              <input
                type="text"
                placeholder="US 10"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Create Task
              </button>
              <button type="button" className="btn" onClick={() => setIsCreatingTask(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task List */}
      <div className="task-list">
        <h2>Tasks ({tasks.length})</h2>

        {tasks.length === 0 ? (
          <div className="empty-state">
            <p>No tasks yet. Create your first task to get started!</p>
          </div>
        ) : (
          <div className="tasks">
            {tasks.map((task) => (
              <div key={task.id} className={`task-card ${getStatusClass(task.status)}`}>
                <div className="task-header">
                  <h3>
                    <span className="status-emoji">{getStatusEmoji(task.status)}</span>
                    {task.productName}
                  </h3>
                  <span className={`task-status ${getStatusClass(task.status)}`}>
                    {task.status.toUpperCase()}
                  </span>
                </div>

                <div className="task-details">
                  <p className="task-size">Size: {task.size}</p>
                  <p className="task-url">{task.productUrl}</p>
                  {task.orderNumber && (
                    <p className="task-order">Order: {task.orderNumber}</p>
                  )}
                  {task.checkoutTime && (
                    <p className="task-time">
                      Checkout time: {(task.checkoutTime / 1000).toFixed(2)}s
                    </p>
                  )}
                  {task.errorMessage && (
                    <p className="task-error">Error: {task.errorMessage}</p>
                  )}
                </div>

                <div className="task-actions">
                  {task.status === 'idle' && (
                    <button className="btn btn-sm btn-success" onClick={() => startTask(task.id)}>
                      Start
                    </button>
                  )}
                  <button className="btn btn-sm btn-danger" onClick={() => deleteTask(task.id)}>
                    Delete
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
