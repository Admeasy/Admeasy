# Seed Scripts

## Seed Mentor Posts

This script creates demo mentor posts for testing the frontend.

### Prerequisites

1. Make sure you have at least one mentor account in your database
2. Ensure your `.env` file has the correct MongoDB connection strings

### Usage

Run the seed script from the Server directory:

```bash
npm run seed:posts
```

Or directly with Node:

```bash
node scripts/seedMentorPosts.js
```

### What it does

- Finds the first mentor in your database
- Creates 10 demo posts with various content types:
  - Text-only posts
  - Posts with images
  - Posts with YouTube link previews
  - Posts with website link previews
  - Posts with both images and links
- Adds random like and comment counts for realistic testing

### Demo Posts Include

1. College admissions insights
2. Study tips for JEE aspirants (with YouTube link)
3. College life experience (with image)
4. Scholarship opportunities (with website link)
5. Book recommendation (with image and link)
6. Interview preparation tips
7. Success story (with image)
8. Useful apps for students (with YouTube link)
9. Study abroad opportunities (with image)
10. Career guidance

### Notes

- The script uses the first mentor found in the database
- If you want to clear existing posts before seeding, uncomment the delete line in the script
- All posts are created with realistic content and formatting
