import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export type AuthContext = {
  userId: string;
};

export async function getAuthContext(): Promise<AuthContext> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return { userId: session.user.id };
}

export function handleError(error: unknown) {
  console.error(error);
  if (error instanceof Error && error.message === "Unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
