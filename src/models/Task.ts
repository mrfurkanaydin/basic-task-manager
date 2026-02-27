import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
  text: string;
  assignees: string[];
  completed: boolean;
  createdAt: number;
}

const TaskSchema: Schema = new Schema(
  {
    text: { type: String, required: true },
    assignees: { type: [String], default: [] },
    completed: { type: Boolean, default: false },
    createdAt: { type: Number, default: () => Date.now() },
  },
  {
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
      },
    },
  },
);

// Avoid OverwriteModelError
export const Task =
  mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);
