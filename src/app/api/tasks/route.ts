import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const dataFilePath = path.join(process.cwd(), "data", "tasks.json");

// Helper to ensure the file exists and read it
async function getTasks() {
  try {
    const data = await fs.readFile(dataFilePath, "utf8");
    return JSON.parse(data);
  } catch (err: any) {
    if (err.code === "ENOENT") {
      await fs.writeFile(dataFilePath, "[]");
      return [];
    }
    throw err;
  }
}

export async function GET() {
  try {
    const tasks = await getTasks();
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tasks = await getTasks();

    const newTask = {
      id: crypto.randomUUID(),
      text: body.text,
      assignees: body.assignees || [],
      completed: false,
      createdAt: Date.now(),
    };

    tasks.unshift(newTask); // Add to beginning
    await fs.writeFile(dataFilePath, JSON.stringify(tasks, null, 2));

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, completed } = body;

    if (!id)
      return NextResponse.json({ error: "Missing task ID" }, { status: 400 });

    const tasks = await getTasks();
    const taskIndex = tasks.findIndex((t: any) => t.id === id);

    if (taskIndex === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    tasks[taskIndex].completed = completed;
    await fs.writeFile(dataFilePath, JSON.stringify(tasks, null, 2));

    return NextResponse.json(tasks[taskIndex]);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id)
      return NextResponse.json({ error: "Missing task ID" }, { status: 400 });

    const tasks = await getTasks();
    const updatedTasks = tasks.filter((t: any) => t.id !== id);

    await fs.writeFile(dataFilePath, JSON.stringify(updatedTasks, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 },
    );
  }
}
