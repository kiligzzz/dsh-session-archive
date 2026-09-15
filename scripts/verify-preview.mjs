import assert from 'node:assert/strict'
import { WorkspaceArchive } from '../lib/index.js'

const events = [
  { seq: 0, type: 'user/message', data: { source: { kind: 'system' }, content: 'hidden' } },
  { seq: 1, type: 'user/message', data: { source: { kind: 'user' }, content: [{ type: 'text', text: 'first question' }] } },
  { seq: 2, type: 'session/title', data: { title: 'Current title' } },
  { seq: 3, type: 'user/message', data: { content: 'second question' } },
]

function archiveWith(handle) {
  return new WorkspaceArchive(
    { requireState: () => ({ archivedSessionIds: ['session-1'] }) },
    { get: () => undefined },
    { open: async () => handle },
  )
}

let closeCalls = 0
const preview = await archiveWith({
  header: { id: 'session-1', cwd: '/workspace', title: 'Header title' },
  read: async () => events,
  close: async () => { closeCalls += 1 },
}).preview('session-1')

assert.deepEqual(preview, {
  title: 'Current title',
  cwd: '/workspace',
  questions: [
    { seq: 1, text: ['first question'] },
    { seq: 3, text: ['second question'] },
  ],
})
assert.equal(closeCalls, 1)

const readFailure = new Error('read failed')
await assert.rejects(
  archiveWith({
    header: { id: 'session-1' },
    read: async () => { throw readFailure },
    close: async () => { closeCalls += 1 },
  }).preview('session-1'),
  readFailure,
)
assert.equal(closeCalls, 2)

console.log('session archive preview verification passed')
