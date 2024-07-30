const { test, after, beforeEach } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)

const Note = require('../models/blog')
const helper = require('./test_helper')

beforeEach(async () => {
  await Note.deleteMany({})

  await Note.insertMany(helper.initialBlogs)
})

test('GET return correct amount of blogs as json', async () => {
  const response = await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)

    assert.strictEqual(response.body.length, 2);
})

test('Blogs have field id instead of _id', async () => {
  const response = await api.get('/api/blogs')
  response.body.forEach(blog => {
    assert(blog.id)
    assert(!blog._id)
  })
})

test('a valid blog can be added', async () => {
  const newBlog = {
    title: 'My daily blog',
    author: 'Henry',
    url: 'www.blog.fi',
    likes: 230
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

    const response = await api.get('/api/blogs')
    const titles = response.body.map(r => r.title)

    assert.strictEqual(response.body.length, helper.initialBlogs.length + 1)

    assert(titles.includes('My daily blog'))
})

test('default likes value is 0', async () =>{
  const newBlog = {
    title: 'Blog about running',
    author: 'James',
    url: 'www.runningblog.com'
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const response = await api.get('/api/blogs')
  const addedBlog = response.body.find(blog => blog.title === 'Blog about running')

  assert.strictEqual(addedBlog.likes, 0)

})

test('statuscode 400 if title field is missing', async () =>{
  const newBlog = {
    author: 'Henri',
    url: 'www.blogi.fi',
    likes: 55
  }

  await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(400);

  const response = await api.get('/api/blogs')
  assert.strictEqual(response.body.length, helper.initialBlogs.length)
})

test('statuscode 400 if url field is missing', async () =>{
  const newBlog = {
    title: 'My new blog',
    author: 'Henriikka',
    likes: 555
  }

  await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(400);

  const response = await api.get('/api/blogs')
  assert.strictEqual(response.body.length, helper.initialBlogs.length)
})

after(async () => {
  await mongoose.connection.close()
})