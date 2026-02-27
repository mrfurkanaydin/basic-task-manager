import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Task } from "@/models/Task";

export async function GET() {
  try {
    await connectToDatabase();

    // Sort by createdAt descending (newest first)
    const tasks = await Task.find({}).sort({ createdAt: -1 });

    // Convert to regular objects to trigger the toJSON transform
    return NextResponse.json(tasks.map((t) => t.toJSON()));
  } catch (error) {
    console.error("GET tasks error", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const newTask = await Task.create({
      text: body.text,
      assignees: body.assignees || [],
      completed: false,
    });

    return NextResponse.json(newTask.toJSON(), { status: 201 });
  } catch (error) {
    console.error("POST tasks error", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { id, completed } = body;

    if (!id)
      return NextResponse.json({ error: "Missing task ID" }, { status: 400 });

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { completed },
      { new: true }, // Return updated document
    );

    if (!updatedTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(updatedTask.toJSON());
  } catch (error) {
    console.error("PUT tasks error", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id)
      return NextResponse.json({ error: "Missing task ID" }, { status: 400 });

    await Task.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE tasks error", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 },
    );
  }
}
