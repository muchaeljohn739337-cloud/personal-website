import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Log the contact form submission (in production, you'd send an email)
    console.log('Contact form submission:', {
      name,
      email,
      subject,
      message,
      timestamp: new Date().toISOString(),
    });

    // TODO: Integrate with email service (SendGrid, Resend, etc.)
    // Example with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'contact@yourdomain.com',
    //   to: 'your-email@example.com',
    //   subject: `Contact Form: ${subject}`,
    //   html: `<p><strong>From:</strong> ${name} (${email})</p><p>${message}</p>`,
    // });

    return NextResponse.json({
      success: true,
      message: 'Message received! I will get back to you soon.',
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Failed to process contact form' }, { status: 500 });
  }
}
