import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Suspend a user
export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId } = params;
    const { reason, expiresAt } = await req.json();

    if (!reason) {
      return NextResponse.json({ error: "Suspension reason is required" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        suspensionReason: reason,
        suspensionExpiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        adminId: (session.user as any).id,
        action: "SUSPENDED_USER",
        targetType: "User",
        targetId: userId,
      },
    });

    // Notify the user
    await prisma.notification.create({
      data: {
        userId,
        type: "SYSTEM",
        referenceId: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("User suspension error:", error);
    return NextResponse.json({ error: "Failed to suspend user" }, { status: 500 });
  }
}

// Unsuspend a user
export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId } = params;

    await prisma.user.update({
      where: { id: userId },
      data: {
        suspensionReason: null,
        suspensionExpiresAt: null,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        adminId: (session.user as any).id,
        action: "UNSUSPENDED_USER",
        targetType: "User",
        targetId: userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("User unsuspension error:", error);
    return NextResponse.json({ error: "Failed to unsuspend user" }, { status: 500 });
  }
}
