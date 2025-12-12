const axios = require("axios");

const BASE_URL = "http://localhost:4000";

async function testBlogAPI() {
  try {
    console.log("🔍 Step 1: Login as admin...");

    // Login as admin (adjust credentials as needed)
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: "admin@advanciapayledger.com",
      password: "Admin123!",
    });

    const token = loginResponse.data.token;
    console.log("✅ Login successful, token obtained");

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // Step 2: Create a blog category first
    console.log("\n🔍 Step 2: Creating blog category...");
    const categoryResponse = await axios.post(
      `${BASE_URL}/api/blog/admin/categories`,
      {
        name: "Technology",
        slug: "technology",
        description: "Tech news and updates",
      },
      { headers }
    );

    const categoryId = categoryResponse.data.category.id;
    console.log(`✅ Category created: ${categoryId}`);

    // Step 3: Create a blog post
    console.log("\n🔍 Step 3: Creating blog post...");
    const postResponse = await axios.post(
      `${BASE_URL}/api/blog/admin/posts`,
      {
        title: "Test Post - Hello World",
        contentMarkdown:
          "# Hello World\n\nThis is a **test post** created via API.\n\n## Features\n\n- Markdown support\n- SEO optimization\n- Auto-generated slugs",
        excerpt: "This is a test excerpt for our first blog post",
        categoryId: categoryId,
        metaTitle: "Test Post SEO Title",
        metaDescription: "This is a test post for SEO optimization",
        keywords: ["test", "blog", "api"],
      },
      { headers }
    );

    console.log("✅ Blog post created successfully!");
    console.log("\n📝 Post Details:");
    console.log(JSON.stringify(postResponse.data, null, 2));

    // Step 4: Get the post by slug
    const slug = postResponse.data.post.slug;
    console.log(`\n🔍 Step 4: Fetching post by slug: ${slug}`);

    const getResponse = await axios.get(`${BASE_URL}/api/blog/posts/${slug}`);
    console.log("✅ Post retrieved successfully!");
    console.log(`   Title: ${getResponse.data.post.title}`);
    console.log(`   Status: ${getResponse.data.post.status}`);
    console.log(`   Views: ${getResponse.data.post.views}`);

    // Step 5: Publish the post
    console.log("\n🔍 Step 5: Publishing the post...");
    const publishResponse = await axios.post(
      `${BASE_URL}/api/blog/admin/posts/${postResponse.data.post.id}/publish`,
      {},
      { headers }
    );

    console.log("✅ Post published successfully!");
    console.log(`   Status: ${publishResponse.data.post.status}`);
    console.log(`   Published at: ${publishResponse.data.post.publishedAt}`);

    console.log("\n🎉 All tests passed!");
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error("\n⚠️  Authentication failed. Please check admin credentials.");
      console.error("   Default: admin@advanciapay.com / Admin123!@#");
    }
    process.exit(1);
  }
}

testBlogAPI();
