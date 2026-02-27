import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Assignee } from "@/models/Assignee";

export async function GET() {
  try {
    await connectToDatabase();

    const assignees = await Assignee.find({}).sort({ name: 1 });
    // Just return array of names to match existing frontend implementation `string[]`
    const names = assignees.map((a) => a.name);

    return NextResponse.json(names);
  } catch (error) {
    console.error("GET assignees error", error);
    return NextResponse.json(
      { error: "Failed to fetch assignees" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }

    const cleanName = name.trim();

    const existing = await Assignee.findOne({ name: cleanName });
    if (existing) {
      return NextResponse.json(
        { error: "Assignee already exists" },
        { status: 400 },
      );
    }

    await Assignee.create({ name: cleanName });

    return NextResponse.json({ name: cleanName }, { status: 201 });
  } catch (error) {
    console.error("POST assignees error", error);
    return NextResponse.json(
      { error: "Failed to add assignee" },
      { status: 500 },
    );
  }
}
