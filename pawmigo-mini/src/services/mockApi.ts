import { db, nextId, persistDb } from '../mock/db'
import { delay, maybeFail, TIMINGS } from '../mock/delay'
import {
  AppNotification, ChatMessage, Comment, Encounter, EncounterCandidate, EncounterMode,
  FeedPost, LoginResult, MapFilter, NearbyPet, Pet, PetInput, PostInput, SafetyItem, Settings,
  ShopItem, Team, TeamInput, Trophy, User, WalletTask, WalletTxn,
} from './types'

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))
const now = () => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

export const mockApi = {
  // --- auth / pet ---
  async wxLogin(_code: string): Promise<LoginResult> {
    await delay(TIMINGS.normal)
    return { token: `mock.${nextId()}`, user: clone(db.user) }
  },
  async me(): Promise<{ user: User; pets: Pet[] }> {
    await delay(TIMINGS.fast)
    return { user: clone(db.user), pets: clone(db.pets) }
  },
  async getPet(id: number): Promise<Pet> {
    await delay(TIMINGS.fast)
    // Search user's own pets first, then convert nearby pets to Pet shape
    const own = db.pets.find((p) => p.id === id)
    if (own) return clone(own)
    // Resolve from nearby — convert NearbyPet to Pet-like shape
    const nb = db.nearby.find((p) => p.id === id)
    if (nb) {
      return {
        id: nb.id, ownerId: 0, name: nb.name, breed: nb.breed,
        gender: '男', age: 2, personality: nb.personality, bio: `常走路线：${nb.route}`,
        boneCount: 0,
      }
    }
    return clone(db.pets[0])
  },
  async createPet(input: PetInput): Promise<Pet> {
    await delay(TIMINGS.normal)
    const pet: Pet = {
      id: nextId(), ownerId: db.user.id, name: input.name || '我的宝贝',
      breed: input.breed || '未知', gender: input.gender || '男', age: input.age ?? 1,
      personality: input.personality || [], bio: input.bio || '', boneCount: 0,
    }
    db.pets.unshift(pet)
    persistDb()
    return clone(pet)
  },
  async updatePet(id: number, input: PetInput): Promise<Pet> {
    await delay(TIMINGS.normal)
    const pet = db.pets.find((p) => p.id === id)
    if (!pet) throw new Error('宠物不存在')
    Object.assign(pet, input)
    persistDb()
    return clone(pet)
  },

  // --- map / walk ---
  async getNearbyWalkers(filter?: MapFilter): Promise<NearbyPet[]> {
    await delay(TIMINGS.normal)
    if (maybeFail()) throw new Error('附近信号弱，请重试')
    let list = db.nearby.filter((p) => !db.blockedIds.includes(p.id))
    if (filter?.size && filter.size !== '全部') list = list.filter((p) => p.size === filter.size)
    if (filter?.personality && filter.personality !== '全部') {
      list = list.filter((p) => p.personality.includes(filter.personality as string))
    }
    return clone(list)
  },
  async setWalkingStatus(on: boolean): Promise<{ walking: boolean }> {
    await delay(TIMINGS.fast)
    return { walking: on }
  },

  // --- encounter ---
  async getCandidates(mode: EncounterMode): Promise<EncounterCandidate[]> {
    await delay(TIMINGS.scan)
    const list = clone(db.candidates)
    // Simulate mode differences: radar shows all, swipe picks one
    if (mode === 'swipe') return list.slice(0, 1)
    return list
  },
  async getActiveEncounter(): Promise<Encounter | null> {
    await delay(TIMINGS.fast)
    return clone(db.activeEncounter)
  },
  async createEncounter(targetId: number): Promise<Encounter> {
    await delay(TIMINGS.fast)
    const target = db.candidates.find((c) => c.id === targetId)
    db.activeEncounter = {
      id: nextId(), targetId, targetName: target?.name || '伙伴',
      status: 'waiting', meetingPoint: target?.meetup || '附近公园', distanceLeft: 120,
      createdAt: Date.now(),
    }
    persistDb()
    return clone(db.activeEncounter)
  },
  async acceptEncounter(id: number): Promise<Encounter> {
    await delay(TIMINGS.fast)
    if (!db.activeEncounter || db.activeEncounter.id !== id) throw new Error('邀约已失效')
    db.activeEncounter.status = 'accepted'
    persistDb()
    return clone(db.activeEncounter)
  },
  async confirmMeetingPoint(id: number, point: string): Promise<Encounter> {
    await delay(TIMINGS.fast)
    if (!db.activeEncounter || db.activeEncounter.id !== id) throw new Error('邀约已失效')
    db.activeEncounter.status = 'meeting'
    db.activeEncounter.meetingPoint = point
    persistDb()
    return clone(db.activeEncounter)
  },
  async cancelEncounter(id: number): Promise<void> {
    await delay(TIMINGS.fast)
    if (db.activeEncounter && db.activeEncounter.id === id) {
      db.activeEncounter = null
      persistDb()
    }
  },
  async submitFeedback(id: number, rating: number, _tags: string[]): Promise<Encounter> {
    await delay(TIMINGS.normal)
    if (!db.activeEncounter || db.activeEncounter.id !== id) throw new Error('邀约已失效')
    db.activeEncounter.status = 'done'
    const reward = 12
    db.wallet.unshift({ id: nextId(), title: '完成一次偶遇反馈', amount: reward, time: '刚刚' })
    db.user.boneBalance += reward
    const result = clone(db.activeEncounter)
    db.activeEncounter = null
    persistDb()
    return result
  },
  async reportPet(id: number, _reason?: string): Promise<{ reported: boolean }> {
    await delay(TIMINGS.fast)
    // Mock: report is recorded as a no-persist acknowledgement.
    return { reported: db.nearby.some((p) => p.id === id) }
  },
  async blockPet(id: number): Promise<{ blockedIds: number[] }> {
    await delay(TIMINGS.fast)
    if (!db.blockedIds.includes(id)) db.blockedIds.push(id)
    persistDb()
    return { blockedIds: clone(db.blockedIds) }
  },

  // --- feed ---
  async getFeed(tab: string): Promise<FeedPost[]> {
    await delay(TIMINGS.normal)
    // Basic tab simulation: shuffle order slightly per tab
    const list = clone(db.posts)
    if (tab === '热门') list.sort((a, b) => b.likes - a.likes)
    if (tab === '关注') return list.slice(0, 2) // fewer posts for "following"
    return list
  },
  async likePost(id: number): Promise<FeedPost> {
    await delay(TIMINGS.fast)
    const post = db.posts.find((p) => p.id === id)
    if (!post) throw new Error('动态不存在')
    post.liked = !post.liked
    post.likes += post.liked ? 1 : -1
    persistDb()
    return clone(post)
  },
  async tipBone(id: number, amount: number): Promise<FeedPost> {
    await delay(TIMINGS.fast)
    const post = db.posts.find((p) => p.id === id)
    if (!post) throw new Error('动态不存在')
    if (db.user.boneBalance < amount) throw new Error('骨头余额不足')
    post.bones += amount
    db.user.boneBalance -= amount
    db.wallet.unshift({ id: nextId(), title: `给 ${post.petName} 投喂骨头`, amount: -amount, time: '刚刚' })
    persistDb()
    return clone(post)
  },
  async getComments(postId: number): Promise<Comment[]> {
    await delay(TIMINGS.fast)
    return clone(db.comments.filter((c) => c.postId === postId))
  },
  async addComment(postId: number, text: string): Promise<Comment> {
    await delay(TIMINGS.fast)
    const c: Comment = { id: nextId(), postId, author: '我', text, time: '刚刚' }
    db.comments.push(c)
    const post = db.posts.find((p) => p.id === postId)
    if (post) post.comments += 1
    persistDb()
    return clone(c)
  },
  async createPost(input: PostInput): Promise<FeedPost> {
    await delay(TIMINGS.normal)
    const pet = db.pets[0]
    const post: FeedPost = {
      id: nextId(), petId: pet?.id || 0, petName: pet?.name || '我的宝贝', breed: pet?.breed || '',
      location: input.location, caption: input.caption, mediaTone: input.mediaTone,
      stickers: input.stickers, likes: 0, bones: 0, comments: 0, liked: false, time: '刚刚',
    }
    db.posts.unshift(post)
    persistDb()
    return clone(post)
  },

  // --- teams ---
  async getTeams(query?: string): Promise<Team[]> {
    await delay(TIMINGS.normal)
    let list = db.teams
    if (query) list = list.filter((t) => t.name.includes(query) || t.tag.includes(query))
    return clone(list)
  },
  async getTeam(id: number): Promise<Team> {
    await delay(TIMINGS.fast)
    const t = db.teams.find((x) => x.id === id) || db.teams[0]
    return clone(t)
  },
  async joinTeam(id: number): Promise<Team> {
    await delay(TIMINGS.fast)
    const t = db.teams.find((x) => x.id === id)
    if (!t) throw new Error('队伍不存在')
    if (!t.joined) { t.joined = true; t.members += 1 }
    persistDb()
    return clone(t)
  },
  async leaveTeam(id: number): Promise<Team> {
    await delay(TIMINGS.fast)
    const t = db.teams.find((x) => x.id === id)
    if (!t) throw new Error('队伍不存在')
    if (t.joined) { t.joined = false; t.members -= 1 }
    persistDb()
    return clone(t)
  },
  async createTeam(input: TeamInput): Promise<Team> {
    await delay(TIMINGS.normal)
    const t: Team = {
      id: nextId(), name: input.name, type: input.type, tag: input.tag,
      members: 1, activity: '新队伍招募中', schedule: input.schedule, vibe: '刚刚成立', joined: true,
    }
    db.teams.unshift(t)
    persistDb()
    return clone(t)
  },
  async signupActivity(teamId: number): Promise<Team> {
    await delay(TIMINGS.fast)
    const t = db.teams.find((x) => x.id === teamId)
    if (!t) throw new Error('队伍不存在')
    if (!t.signedUp) { t.signedUp = true; t.members += 1 }
    persistDb()
    return clone(t)
  },

  // --- wallet ---
  async getWallet(): Promise<{ balance: number; ledger: WalletTxn[] }> {
    await delay(TIMINGS.fast)
    return { balance: db.user.boneBalance, ledger: clone(db.wallet) }
  },
  async getWalletTasks(): Promise<WalletTask[]> {
    await delay(TIMINGS.fast)
    return clone(db.walletTasks)
  },
  async claimTask(id: number): Promise<{ balance: number; tasks: WalletTask[] }> {
    await delay(TIMINGS.fast)
    const task = db.walletTasks.find((t) => t.id === id)
    if (!task) throw new Error('任务不存在')
    if (!task.done) {
      task.done = true
      db.user.boneBalance += task.reward
      db.wallet.unshift({ id: nextId(), title: task.title, amount: task.reward, time: '刚刚' })
    }
    persistDb()
    return { balance: db.user.boneBalance, tasks: clone(db.walletTasks) }
  },
  async getShop(): Promise<ShopItem[]> {
    await delay(TIMINGS.fast)
    return clone(db.shop)
  },
  async redeem(itemId: number, costOverride?: number): Promise<{ balance: number }> {
    await delay(TIMINGS.normal)
    const item = db.shop.find((s) => s.id === itemId)
    const cost = costOverride ?? item?.cost ?? 0
    if (db.user.boneBalance < cost) throw new Error('骨头余额不足')
    db.user.boneBalance -= cost
    db.wallet.unshift({ id: nextId(), title: `兑换 ${item?.name || '权益'}`, amount: -cost, time: '刚刚' })
    persistDb()
    return { balance: db.user.boneBalance }
  },

  // --- chat ---
  async getChat(peerId: number): Promise<ChatMessage[]> {
    await delay(TIMINGS.fast)
    return clone(db.chats.filter((m) => m.peerId === peerId))
  },
  async sendMessage(peerId: number, text: string): Promise<ChatMessage> {
    await delay(TIMINGS.fast)
    const msg: ChatMessage = { id: nextId(), peerId, side: 'right', name: '我', text, time: now() }
    db.chats.push(msg)
    persistDb()
    return clone(msg)
  },
  async simulateReply(peerId: number): Promise<ChatMessage> {
    await delay(TIMINGS.chatReply)
    const reply: ChatMessage = { id: nextId(), peerId, side: 'left', name: '对方', text: '好的，路上注意安全～', time: now() }
    db.chats.push(reply)
    persistDb()
    return clone(reply)
  },

  // --- profile ---
  async getTrophies(): Promise<Trophy[]> {
    await delay(TIMINGS.fast)
    return clone(db.trophies)
  },
  async getSafety(): Promise<{ score: number; items: SafetyItem[] }> {
    await delay(TIMINGS.fast)
    return { score: 98, items: clone(db.safety) }
  },
  async getNotifications(): Promise<AppNotification[]> {
    await delay(TIMINGS.fast)
    return clone(db.notifications)
  },
  async updateSettings(patch: Partial<Settings>): Promise<Settings> {
    await delay(TIMINGS.fast)
    Object.assign(db.settings, patch)
    persistDb()
    return clone(db.settings)
  },
}

export type MockApi = typeof mockApi
