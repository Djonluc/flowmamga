import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: 'Reset Your FlowManga Password',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3b82f6;">Reset Your Password</h1>
          <p>You requested to reset your password for your FlowManga account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Failed to send email');
  }
}

export async function sendCommentNotificationEmail(
  email: string,
  commenterName: string,
  comicTitle: string,
  commentText: string,
  comicSlug: string
) {
  const comicUrl = `${process.env.NEXT_PUBLIC_APP_URL}/comic/${comicSlug}`;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: `New comment on "${comicTitle}"`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3b82f6;">New Comment</h1>
          <p><strong>${commenterName}</strong> commented on your comic <strong>"${comicTitle}"</strong>:</p>
          <blockquote style="border-left: 4px solid #3b82f6; padding-left: 16px; margin: 16px 0; color: #666;">
            ${commentText}
          </blockquote>
          <a href="${comicUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
            View Comment
          </a>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send comment notification:', error);
  }
}

export async function sendLikeNotificationEmail(
  email: string,
  likerName: string,
  comicTitle: string,
  comicSlug: string
) {
  const comicUrl = `${process.env.NEXT_PUBLIC_APP_URL}/comic/${comicSlug}`;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: `${likerName} liked your comic!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ec4899;">❤️ New Like</h1>
          <p><strong>${likerName}</strong> liked your comic <strong>"${comicTitle}"</strong>!</p>
          <a href="${comicUrl}" style="display: inline-block; background: #ec4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
            View Comic
          </a>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send like notification:', error);
  }
}

export async function sendPublishNotificationEmail(
  email: string,
  comicTitle: string,
  comicSlug: string
) {
  const comicUrl = `${process.env.NEXT_PUBLIC_APP_URL}/comic/${comicSlug}`;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: `Your comic "${comicTitle}" is now live!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">🎉 Comic Published!</h1>
          <p>Your comic <strong>"${comicTitle}"</strong> has been published and is now live on FlowManga!</p>
          <a href="${comicUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
            View Your Comic
          </a>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send publish notification:', error);
  }
}
