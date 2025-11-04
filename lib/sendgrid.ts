import sgMail from '@sendgrid/mail';

// Initialize SendGrid
const sendGridApiKey = process.env.SENDGRID_API_KEY;
if (sendGridApiKey) {
  sgMail.setApiKey(sendGridApiKey);
}

interface BookingEmailData {
  userEmail: string;
  userName?: string;
  roomName: string;
  roomEmail: string;
  startTime: Date;
  endTime: Date;
  title: string;
  description?: string;
}

/**
 * Send booking confirmation email to user
 */
export async function sendBookingConfirmationEmail(data: BookingEmailData) {
  if (!sendGridApiKey) {
    console.warn('SENDGRID_API_KEY not set - skipping email');
    return;
  }

  try {
    const startDate = new Intl.DateTimeFormat('nl-NL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(data.startTime);

    const endTime = new Intl.DateTimeFormat('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(data.endTime);

    const msg = {
      to: data.userEmail,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@rooms.local',
      subject: `✅ Room Booking Confirmed: ${data.roomName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(to right, #14b8a6, #06b6d4); padding: 20px; border-radius: 8px; color: white;">
            <h1 style="margin: 0; font-size: 24px;">Room Booking Confirmed ✅</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9fafb;">
            <h2 style="color: #1f2937; margin-top: 0;">Booking Details</h2>
            
            <div style="background-color: white; padding: 15px; border-radius: 6px; border-left: 4px solid #14b8a6;">
              <p><strong>Room:</strong> ${data.roomName}</p>
              <p><strong>Date & Time:</strong> ${startDate} - ${endTime}</p>
              <p><strong>Title:</strong> ${data.title}</p>
              ${data.description ? `<p><strong>Description:</strong> ${data.description}</p>` : ''}
              <p><strong>Room Email:</strong> ${data.roomEmail}</p>
            </div>
            
            <h3 style="color: #1f2937; margin-top: 20px;">What happens next?</h3>
            <ul style="color: #4b5563;">
              <li>The room has been sent a meeting invitation</li>
              <li>Both you and the room will receive calendar invitations</li>
              <li>The room will appear as 'Busy' in Outlook during this time</li>
              <li>You'll receive a reminder 15 minutes before the meeting</li>
            </ul>
            
            <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
              This is an automated email from Rooms. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    };

    await sgMail.send(msg);
    console.log(`✅ Booking confirmation email sent to ${data.userEmail}`);
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    // Don't throw - email is optional, booking should still succeed
  }
}

/**
 * Send booking cancellation email
 */
export async function sendBookingCancellationEmail(data: BookingEmailData) {
  if (!sendGridApiKey) {
    console.warn('SENDGRID_API_KEY not set - skipping email');
    return;
  }

  try {
    const startDate = new Intl.DateTimeFormat('nl-NL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(data.startTime);

    const msg = {
      to: data.userEmail,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@rooms.local',
      subject: `❌ Room Booking Cancelled: ${data.roomName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(to right, #ef4444, #f87171); padding: 20px; border-radius: 8px; color: white;">
            <h1 style="margin: 0; font-size: 24px;">Booking Cancelled ❌</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9fafb;">
            <p style="color: #4b5563;">Your booking for <strong>${data.roomName}</strong> has been cancelled.</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 6px; border-left: 4px solid #ef4444;">
              <p><strong>Room:</strong> ${data.roomName}</p>
              <p><strong>Date & Time:</strong> ${startDate}</p>
              <p><strong>Title:</strong> ${data.title}</p>
            </div>
            
            <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
              Both you and the room resource have been notified of this cancellation.
            </p>
          </div>
        </div>
      `,
    };

    await sgMail.send(msg);
    console.log(`✅ Booking cancellation email sent to ${data.userEmail}`);
  } catch (error) {
    console.error('Error sending booking cancellation email:', error);
  }
}
