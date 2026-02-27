import mongoose, { Schema, Document } from "mongoose";

export interface IAssignee extends Document {
  name: string;
}

const AssigneeSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
  },
  {
    toJSON: {
      transform: function (doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
      },
    },
  },
);

// Avoid OverwriteModelError
export const Assignee =
  mongoose.models.Assignee ||
  mongoose.model<IAssignee>("Assignee", AssigneeSchema);
