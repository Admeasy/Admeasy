/**
 * Seed script to create demo mentor posts for testing
 * Run with: node Server/scripts/seedMentorPosts.js
 */

// Load environment variables FIRST before requiring db.js
const path = require('path');
const envPath = path.join(__dirname, '..', '.env');
require('dotenv').config({ path: envPath });

// Verify environment variable exists
if (!process.env.MONGODB_ADMEASY_URI) {
  console.error('❌ Error: MONGODB_ADMEASY_URI not found in environment variables');
  console.error(`Looking for .env at: ${envPath}`);
  console.error('Please make sure your .env file exists and contains MONGODB_ADMEASY_URI');
  process.exit(1);
}

console.log('✅ Environment variables loaded');

const mongoose = require('mongoose');
const { Admeasy } = require('../db');
const MentorPost = require('../models/mentorPostSchema');
const Mentor = require('../models/mentorSchema');

const demoPosts = [
  {
    content: `🎓 Excited to share some insights about college admissions!

The journey to your dream college starts with understanding the process. Here are a few key points:

1. Research thoroughly - Look beyond rankings
2. Connect with current students and alumni
3. Prepare well for entrance exams
4. Don't forget about extracurricular activities

Remember, every student's journey is unique. What worked for someone else might not work for you, and that's okay!

Feel free to reach out if you have any questions. I'm here to help! 💪`,
    image: null,
    externalLink: null,
  },
  {
    content: `📚 Study Tips for JEE Aspirants

As someone who has been through this journey, here are some tips that helped me:

• Consistency beats intensity - Study daily, even if it's just 2-3 hours
• Focus on understanding concepts, not just solving problems
• Take regular breaks - Your brain needs rest
• Practice previous year papers religiously
• Join study groups - Teaching others helps you learn better

The key is to stay motivated and keep pushing forward. You've got this! 🚀`,
    image: null,
    externalLink: {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      preview: {
        title: 'Study Tips Video',
        description: 'Learn effective study techniques',
        image: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        domain: 'youtube.com',
        platform: 'youtube',
      },
    },
  },
  {
    content: `🌟 College Life Experience

Just wanted to share a glimpse of campus life! The college experience is so much more than just academics. It's about:

- Making lifelong friendships
- Discovering your passions
- Learning to be independent
- Building your network
- Creating memories that last forever

If you're nervous about starting college, don't worry - everyone feels the same way. You'll find your place! 😊`,
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
    externalLink: null,
  },
  {
    content: `💡 Important Update: New Scholarship Opportunities Available!

I just came across some amazing scholarship programs that might interest you:

1. Merit-based scholarships for top performers
2. Need-based financial aid
3. Sports and arts scholarships
4. Research grants for graduate students

Check out the official website for more details and application deadlines. Don't miss out on these opportunities!`,
    image: null,
    externalLink: {
      url: 'https://www.example-scholarship-portal.com',
      preview: {
        title: 'Scholarship Portal - Apply Now',
        description: 'Discover various scholarship opportunities for students',
        image: null,
        domain: 'example-scholarship-portal.com',
        platform: 'website',
      },
    },
  },
  {
    content: `📖 Book Recommendation: "The College Guide"

I recently read this amazing book that provides comprehensive guidance on:
- Choosing the right college
- Application strategies
- Interview preparation
- Financial planning

Highly recommend it to all students and parents navigating the college admission process. It's available on major online platforms.

What books have helped you in your journey? Share in the comments! 📚`,
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800',
    externalLink: {
      url: 'https://www.amazon.com/college-guide',
      preview: {
        title: 'The College Guide - Amazon',
        description: 'Comprehensive guide to college admissions',
        image: null,
        domain: 'amazon.com',
        platform: 'website',
      },
    },
  },
  {
    content: `🎯 Quick Tips: How to Prepare for College Interviews

College interviews can be nerve-wracking, but with proper preparation, you can ace them:

✅ Research the college thoroughly
✅ Prepare answers for common questions
✅ Practice with mock interviews
✅ Dress appropriately
✅ Be yourself - authenticity matters
✅ Prepare questions to ask them

Remember, interviews are a two-way street. You're also evaluating if the college is right for you!`,
    image: null,
    externalLink: null,
  },
  {
    content: `🏆 Success Story: From Dream to Reality

I'm thrilled to share that one of my mentees just got accepted into their dream college! 

The journey wasn't easy - it took months of preparation, countless hours of study, and unwavering determination. But seeing their success makes it all worth it.

To all the students out there: Keep pushing forward. Your hard work will pay off! 💪

If you need guidance or have questions, feel free to reach out.`,
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800',
    externalLink: null,
  },
  {
    content: `📱 Useful Apps for Students

Here are some apps that have been game-changers for students:

📚 Study Apps:
- Anki for flashcards
- Forest for focus
- Notion for note-taking

⏰ Productivity:
- Todoist for task management
- Google Calendar for scheduling
- Focus Keeper for Pomodoro technique

Check them out and see which ones work for you!`,
    image: null,
    externalLink: {
      url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
      preview: {
        title: 'Productivity Apps Review',
        description: 'Best apps for student productivity',
        image: 'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg',
        domain: 'youtube.com',
        platform: 'youtube',
      },
    },
  },
  {
    content: `🌍 Study Abroad Opportunities

Thinking about studying abroad? Here's what you need to know:

• Research universities and programs early
• Check visa requirements
• Look into scholarships and financial aid
• Prepare for language tests (IELTS, TOEFL)
• Connect with current international students

Studying abroad can be a life-changing experience. It opens doors to new cultures, perspectives, and opportunities.

Have questions? Drop them in the comments!`,
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800',
    externalLink: null,
  },
  {
    content: `💼 Career Guidance: Choosing Your Path

One of the most common questions I get is: "How do I choose the right career?"

Here's my advice:
1. Explore your interests and passions
2. Research different career paths
3. Talk to professionals in fields you're interested in
4. Consider your strengths and values
5. Don't be afraid to change your mind

Remember, it's okay to not have everything figured out. Your career path can evolve over time!`,
    image: null,
    externalLink: null,
  },
];

async function seedMentorPosts() {
  try {
    console.log('🌱 Starting to seed mentor posts...');
    
    // Wait for database connection
    await new Promise((resolve, reject) => {
      if (Admeasy.readyState === 1) {
        console.log('✅ Database already connected');
        resolve();
      } else {
        Admeasy.once('connected', () => {
          console.log('✅ Database connected');
          resolve();
        });
        Admeasy.once('error', reject);
        // Timeout after 10 seconds
        setTimeout(() => reject(new Error('Database connection timeout')), 10000);
      }
    });

    // Find an existing mentor or use the first one
    const mentor = await Mentor.findOne();
    
    if (!mentor) {
      console.error('❌ No mentors found in database. Please create a mentor first.');
      process.exit(1);
    }

    console.log(`✅ Found mentor: ${mentor.name} (${mentor.username || mentor.email})`);

    // Clear existing demo posts (optional - comment out if you want to keep existing posts)
    // await MentorPost.deleteMany({ mentorId: mentor._id });
    // console.log('🗑️  Cleared existing posts');

    // Create demo posts
    const createdPosts = [];
    for (let i = 0; i < demoPosts.length; i++) {
      const postData = {
        mentorId: mentor._id,
        content: demoPosts[i].content,
        image: demoPosts[i].image,
        externalLink: demoPosts[i].externalLink,
        likesCount: Math.floor(Math.random() * 50), // Random likes between 0-50
        commentsCount: Math.floor(Math.random() * 20), // Random comments between 0-20
      };

      const post = new MentorPost(postData);
      await post.save();
      createdPosts.push(post);
      
      console.log(`✅ Created post ${i + 1}/${demoPosts.length}: "${post.content.substring(0, 50)}..."`);
    }

    console.log(`\n🎉 Successfully created ${createdPosts.length} demo posts!`);
    console.log(`📊 Posts created for mentor: ${mentor.name}`);
    console.log(`\n💡 You can now test the frontend at: /mentor-posts`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding mentor posts:', error);
    process.exit(1);
  }
}

// Run the seed function
seedMentorPosts();
