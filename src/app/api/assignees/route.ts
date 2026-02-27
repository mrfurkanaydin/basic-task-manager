import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const dataFilePath = path.join(process.cwd(), "data", "assignees.json");

async function getAssignees() {
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
    const assignees = await getAssignees();
    return NextResponse.json(assignees);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch assignees" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }

    const assignees = await getAssignees();
    const cleanName = name.trim();

    if (assignees.includes(cleanName)) {
      return NextResponse.json(
        { error: "Assignee already exists" },
        { status: 400 },
      );
    }

    assignees.push(cleanName);
    await fs.writeFile(dataFilePath, JSON.stringify(assignees, null, 2));

    return NextResponse.json({ name: cleanName }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to add assignee" },
      { status: 500 },
    );
  }
}
