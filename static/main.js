'use strict'
const libopenmpt = {}

const params = parseUrlParams()
initSession()

// --- playing program config

const modes = [
  {name: '📀 Auto', p: '@auto', title: 'Automatically selects playlist depending on time of the day'},
  {name: '🎲 All', p: 'accepted', title: 'Random music from full hand-picked collection'},
  {name: '🃏 Whatever', p: 'playable', title: 'Random music from anything playable in collection', hidden: true},

  {name: '👍 Good', p: 'day_good', title: 'Collection of pretty good tracks, usually played from 14:00 to 17:00'},
  {name: '🏅 Gold', p: 'day_gold', title: 'Golden collection, usually played from 15:00 to 16:00'},
  {name: '👑 Best', p: 'day_best', title: 'Collection of best masterpieces'},

  {name: '🏙️ Day', p: 'day', title: 'Active musical tracks usually played during day'},
  {name: '🌇 Evening', p: 'night_1', title: 'Musical tracks usually played around 21:00'},
  {name: '🌆 Twilight', p: 'night_2', title: 'Partially calm tracks usually played around 22:30'},
  {name: '🌉 Night', p: 'night_wide', title: 'Calm tracks usually played from 22:00 to 06:00'},
  {name: '🌃 Midnight', p: 'night_4', title: 'Calm tracks usually played from 00:00 to 05:00'},
  {name: '🌄 Morning', p: 'morning_2', title: 'Calm and active tracks usually played around 09:00'},

  {name: '🌌 Cosmical', p: ':cosm', title: 'Coolest spacious cosmical music for imagination (best themed playlist!)'},
  {name: '🍹 Cozy', p: 'group_cozy'},
  {name: '🛩️ Flight', p: ':flight'},
  {name: '✨ Shiny', p: 'group_shiny'},
  {name: '🧼 Dishwash', p: ':rld', title: 'A few calm same-style tracks for monotonous work'},
  {name: '🎸 Rock', p: ':rock'},
  {name: '📼 Remix', p: 'group_remix', title: 'Remixes & remakes'},
  {name: '🎃 Pumpkin', p: 'group_pumpkin', title: 'Some mildly witchy & spooky tracks'},
  {name: '🎄 New Year', p: ':xmas', title: 'Festive holiday music', hidden: true},
  {name: '🍰 Happy', p: 'mood_gold', title: 'Happy music to cheer up ^^'},
  {name: '🌧️ Sorrow', p: ':sorrow', title: 'Sad tracks to comfort you'},

  {name: '📻 KeygenFM', p: '*k:1', title: 'Music present in KeygenFM playlists', hidden: true},
  {name: '🎩 c512w', p: ':c512w', title: 'Music by c512w', hidden: true},
  {name: '🧪 LHS', p: ':agg|:aggrld|:rld', title: 'Music by LHS (and in LHS style)', hidden: true},
  {name: '🌠 MrGamer', p: ':mrg', title: 'Music by MrGamer', hidden: true},
  {name: '🎷 JosSs', p: '*:josss', title: 'Music by JosSs', hidden: true},

  {name: '👄 Voice', p: '*:d:v', title: 'Tracks that contain any speech (mostly excluded from other playlists)', hidden: true},
  {name: '🪣 Untested', p: 'unprocessed', title: 'Tracks that were not processed yet, but exist in collection', hidden: true},
  {name: '🗑️ Unadded', p: 'unaccepted', title: 'Tracks (mostly low quality?) that were not accepted (yet), but exist in collection', hidden: true},

  {name: '🏛️ ModArchive', p: '!ma:random', title: 'Random music from modarchive.org - a huge external collection of over 170K tracks!'},

  {name: '🛠️ Custom', p: 'custom', title: 'Custom playlist', hidden: 2}
]
const hourlyProgram = [
  /* 00: */ 'night_4',
  /* 01: */ 'night_5',
  /* 02: */ 'night_5',
  /* 03: */ 'night_5',
  /* 04: */ 'night_4',
  /* 05: */ 'night_wide',
  /* 06: */ 'morning_0',
  /* 07: */ 'morning_1',
  /* 08: */ 'morning_2',
  /* 09: */ 'morning_2',
  /* 10: */ 'morning_3',
  /* 11: */ 'morning_3',
  /* 12: */ 'day',
  /* 13: */ 'day',
  /* 14: */ 'day_good',
  /* 15: */ 'day_gold',
  /* 16: */ 'day_good',
  /* 17: */ 'day',
  /* 18: */ '@event',
  /* 19: */ 'night_pre',
  /* 20: */ 'night_0',
  /* 21: */ 'night_1',
  /* 22: */ 'night_2',
  /* 23: */ 'night_3',
]
const weekdayProgramEvent = [
  /* SUN */ 'group_cozy',
  /* MON */ 'group_agglike',
  /* TUE */ ':flight',
  /* WED */ ':rock',
  /* THU */ ':cosm',
  /* FRI */ 'group_party',
  /* SAT */ 'group_shiny',
]
const holidayProgramFull = {
  '04-12': ':cosm',
}
const holidayProgramEvent = {
  '10-30': 'group_pumpkin',
  '10-31': 'group_pumpkin',
  '12-25': ':xmas',
  '12-31': ':xmas',
  '01-01': ':xmas',
}

const playlistAlias = {
  day: 'c:0123',
  day_good: 'c:123',
  day_gold: 'c:23',
  day_best: 'c:3',
  night_pre: 'q:1|c:0123',
  night_0: 'q:1|c:0123;q:23',
  night_1: 'q:12|c:0123;q:3',
  night_2: 'q:2|c:0123;q:23',
  night_3: 'q:23',
  night_4: 'q:345',
  night_5: 'q:45',
  night_wide: 'q:2345',
  morning_0: 'c:0123m;q:2345',
  morning_1: 'c:0123m;q:2345|c:m;q:1',
  morning_2: 'c:0123m;q:m23|c:m;q:1',
  morning_3: 'c:0123m|c:m;q:123',
  mood_gold: 'm:23',
  mood_sad: 'm:s|:sorrow',
  group_cozy: ':summer|:slq|:forest|:ench|:bfuture',
  group_shiny: ':gem|:clarity|:vrl',
  group_party: 'c:3|:dec|:cff|:tubes|:megamix',
  group_agglike: ':agg|:aggrld',
  group_pumpkin: ':hut|:sour|:aggrld|:hlwn',
  group_remix: ':remake|:remix|:megamix',
  unprocessed: '*c:_',
  unaccepted: '*c:udx;:!dup;:!d:v',
}

// --- player config

const playableExts = ['xm', 'mod', 'it', 's3m', 'fc13', 'fc14', 'mo3', 'mtm', 'mptm', 'mt2'] // openmpt can play only those
// Well, actually...
// Formats supported by https://lib.openmpt.org/libopenmpt/2025/05/31/release-0.8.0/:
// mptm, mod, s3m, xm, it, 667, 669, amf, ams, c67, cba, dbm, digi, dmf, dsm, dsym, dtm,
// etx, far, fc, fc13, fc14, fmt, fst, ftm, imf, ims, ice, j2b, m15, mdl, med, mms, mt2, mtm, mus,
// nst, okt, plm, psm, pt36, ptm, puma, rtm, sfx, sfx2, smod, st26, stk, stm, stx, stp, symmod,
// gmc, gtk, gt2, ult, unic, wow, xmf, gdm, mo3, oxm, umx, xpk, ppm, mmcmp

const urlConfig = {
  collectionUrlRoot: location.hostname.match(/localhost|\d+(\.\d+){3}/) ? './collection/'
    : 'https://raw.githubusercontent.com/pl4yg3n/collection/refs/heads/main/',
  indexPathLocal: 'index.csv',
  musicPathLocal: 'data/',
  musicUrlModArchive: 'https://api.modarchive.org/downloads.php?moduleid=',
  pageUrlModArchive: 'https://modarchive.org/index.php?request=view_by_moduleid&query=',
  modArchiveMaxId: 212748,
}
const state = {
  playerConfig: {
    bufferSize: 1 << Math.min(Math.max(Math.log2(+params.buffer || localStorage['playgen:bufferSize']) || 12, 8), 14),
    smoothing: Math.abs(+params.smoothing || (localStorage['playgen:filter'] == 'smooth' ? 80 : 0) || 0),

    // speed is a multiplier, but its changes are in log2 scale
    speed: Math.abs(+params.speed || 1),
    speedExpStep: 1/8,
    speedExpMin: -3,
    speedExpMax: 3,
    speedExpPrecision: 1/32,

    // all volume in relative millibells
    volume: Math.min(+params.volume || 0, 0),
    volumeStep: 250,
    volumeMin: -4000,
    volumeMax: 0,
    volumePrecision: 1,
    volumeAddForLowVolumeTracks: 500,

    // seek/rewind in seconds
    rewindStepSeconds: 5,
    rewindTailSeconds: 20,
    seekPrecision: 0.1,

    repeatCount: (x => x === true ? -1 : +x)(params.repeat) || null,
    sequentially: !!params.seq,
    autoplay: !!params.autoplay,
    restoreOnRefreshExpireMs: 3600000, // 1h
    restoreOnRefreshOnlyIfPlaying: false,

    bubbleIntroMs: 750,
    tickFactor: 1 / 3,
    maxQueueHistorySize: Math.max(Math.floor(+params.qsize) || 100, 0),
    useGraph: !!params.graph,
    graphParams: {
      w: 2048,
      h: 320,
      lineWidth: 1.5,
    }
  },
  player: null, // wasm backend to play buffer
  queue: [], // playing sequence (history + current + enqueued)
  queueIndex: -1, // queue position of currently played item
  playIndex: -1, // sequential id to prevent possible problems in case of concurrent loading
  source: null,
  anim: {
    enabled: !!params.anim,
    state: false,
    timer: null,
  },
  keyDownListeners: {},
}

// --- playing logic init

async function launchPlayer() {
  setMediaIcon()
  await createFakeAudioToMakeMediaSessionWork()
  state.player = new ChiptuneJsPlayer(state.playerConfig)
  state.player.onEnded = playNext
  state.player.onTick = updateProgress
}

function setMediaIcon() {
  navigator.mediaSession.metadata = new MediaMetadata({
    artwork: [
      {src: './static/img/pkey.svg', sizes: '256x256,512x512', type: 'image/svg+xml'},
      {src: './static/img/pkey256.png', sizes: '256x256', type: 'image/png'},
    ]
  })
}

// --- switching tracks

function hasNext() {
  return state.queueIndex + 1 < state.queue.length
}

async function playNext() {
  if (!state.player) await launchPlayer()
  enqNextIfNeeded() // if nothing is enqueued to play, need to add something
  state.queueIndex++
  return playQueue()
}

async function playBack() {
  if (!state.player) await launchPlayer()
  if (state.queueIndex < 0) return playNext()
  if (state.queueIndex == 0) {
    state.player.setCurrentSeconds(0)
    return
  }
  state.queueIndex--
  return playQueue()
}

function enqNextIfNeeded(hint) {
  if (!hasNext()) enqNext(hint)
}

function isPlaying() {
  return state.player && state.player.currentPlayingNode && !state.player.currentPlayingNode.paused
}

// --- queue management

async function enqNext(hint) {
  if (!state.player) return
  if (!state.source) return
  if (typeof state.source == 'string') {
    if (state.source == 'ma:random') {
      return enqMa(0, 0).catch(err => {
        if (typeof err == 'string' && err.startsWith('Invalid response')) {
          enqNextIfNeeded()
        } else {
          throw err
        }
      })
    }
    return enqOnError('invalid source')
  }
  let e = pick(state.source, hint)
  return enqEntry(e, 0)
}

function pick(arr, hint) {
  if (arr.length == 0) throw 'Cannot pick from empty array!'
  if (state.playerConfig.sequentially) {
    if (hint && hint.e) {
      let index = arr.indexOf(hint.e) + 1
      if (index == arr.length) {
        index = 0
      }
      return arr[index]
    }
    return arr[0]
  }
  return arr[Math.floor(Math.random() * arr.length)]
}

async function enqLocal(query) {
  return enqEntry(pick(playlists.full.filter(x => x.md5 == query || x.title.includes(query))))
    .then(q => {console.info('Enqueued:', q); return q})
}

async function enqById(id, solid=1) {
  if (id.startsWith('ma:')) return enqMa(id.slice(3), solid)
  return enqEntry(pick(playlists.full.filter(x => x.md5.startsWith(id))), solid)
}

async function enqUrl(url, color='#999', solid=2) {
  return addToQueue({
    src: url,
    color,
    solid,
  }).then(q => {console.info('Enqueued:', q); return q})
}

async function enqMa(id, solid=2) {
  id = +id
  if (!id) {
    id = Math.floor(Math.random() * urlConfig.modArchiveMaxId) + 1
  }
  return addToQueue({
    src: urlConfig.musicUrlModArchive + id,
    color: '#99a8a8',
    id: 'ma:' + id,
    idMa: id,
    solid,
  })
}

function getTimeParamOnce() {
  let t = params.t
  if (!t) return
  delete params.t
  return t
}

async function enqEntry(e, solid=1, customMetadata) {
  return addToQueue({
    e,
    src: urlConfig.collectionUrlRoot + urlConfig.musicPathLocal + e.path.replaceAll('%', '%25').replaceAll('#', '%23'),
    color: category_to_color(e.c, e.q, e.m),
    insn: {
      start: e.tags['t:start'],
      t: getTimeParamOnce(),
      end: e.tags['t:end'],
      repeat: e.tags['repeat'],
      gainMillibells: (e.tags['d:lvol'] || 0) * state.playerConfig.volumeAddForLowVolumeTracks,
    },
    id: e.md5.slice(0, 10),
    idMa: +e.tags['id:ma'] || null,
    solid,
    customMetadata: customMetadata
  })
}

function smashQueue(force) {
  if (!force) return false
  while (state.queue.length) {
    let last = state.queue[state.queue.length - 1]
    if (force <= last.solid) return false
    if (!hasNext()) return true
    unlistQueueItem(last)
  }
  return force > 1
}

async function addToQueue(q) {
  let smashCurrent = smashQueue(q.solid)
  q.queueIndex = state.queue.push(q) - 1
  console.debug('Added to queue:', q)
  let loaded = q.buffer ? Promise.resolve(q) : fetch(q.src)
    .then(x => {
      if (x.status != 200) throw 'Bad response status: ' + x.status + ' at ' + q.src
      return x.arrayBuffer()
    })
    .then(buffer => {
      if (buffer.byteLength < 20) throw 'Invalid response at ' + q.src
      q.buffer = buffer
      console.debug('Loaded:', q.src)
      return q
    })
    .catch(err => {
      console.error('Failed to load:', err)
      unlistQueueItem(q)
      throw err
    })
  q.loaded = loaded
  if (state.queue[state.queueIndex] == q) {
    playQueue()
  } else if (smashCurrent) {
    playNext()
  }
  return loaded
}

async function playQueue() {
  let q = state.queue[state.queueIndex]
  if (!q) {
    throw 'Queue is empty at current index!'
  }
  if (!q.prepared) {
    setGraffitiStatus('loading')
    if (!q.solid) q.solid = 1
    let playIndex = ++state.playIndex
    q.prepared = q.loaded
      .then(q => playQueueItem(q, playIndex))
      .then(q => {
        if (playIndex == state.playIndex) setGraffitiStatus(q.customMetadata ? 'error' : 'ok')
        return q
      }, err => {
        if (playIndex == state.playIndex) setGraffitiStatus('error')
        q.prepared = null
        throw err
      })
  }
  return q.prepared
}

function playQueueItem(q, playIndex) {
  q.prepared = null
  if (!q || !q.buffer) {
    if (q) unlistQueueItem(q)
    throw 'Cannot play what is not loaded!'
  }
  if (playIndex != state.playIndex) {
    console.warn('Queue item tried to play too late (probably was skipped during loading)!')
    return q
  }
  q.played = true
  setPlayingStyle(q)
  try {
    state.player.play(q.buffer, q.insn)
    displayMetadata(q)
    resetProgress()
    withElem('more-options', elem => elem.parentElement.hidden = false)
  } catch (err) {
    unlistQueueItem(q)
    if (!q.customMetadata) playOnError(err)
  }
  // todo: unload buffer after another play
  //if (!q.persist) q.buffer = null
  trimQueueHistory()
  state.resetPause()
  enqNextIfNeeded(q)
  return q
}

function unlistQueueItem(q) {
  return dropQueueChunk(state.queue.indexOf(q))
}

function trimQueueHistory() {
  let removeTo = state.queueIndex - state.playerConfig.maxQueueHistorySize
  if (removeTo <= 0) return false
  return dropQueueChunk(0, removeTo)
}

function dropQueueChunk(removedIndex, count=1) {
  if (count <= 0 || (removedIndex + count) <= 0) return false

  let removed = state.queue.splice(removedIndex, count)
  console.debug(`Removed ${removed.length} items at index ${removedIndex} from queue:`, removed)

  state.queue.slice(removedIndex).forEach(q => q.queueIndex -= count)
  if (state.queueIndex >= removedIndex) {
    if (state.queueIndex < removedIndex + count) {
      // currently playing item is inside deleted chunk
      // todo: specify what to do in this situation
      state.resetPause()
      state.queueIndex = removedIndex - 1
    } else {
      // currently playing item is ahead of deleted chunk
      state.queueIndex -= count
    }
  }
}

// --- metadata output

async function displayMetadata(q) {
  let data = q.customMetadata || state.player.metadata()
  withElem('metadata-container', e => e.hidden = false)
  withElem('output-id', e => e.textContent = q.id ? 'id: ' + q.id : (q.src || ''))
  withElem('share-id', shareButton => {
    shareButton.hidden = !q.id
    if (q.id) {
      shareButton._id = q.id
      shareButton.textContent = shareButton.getAttribute('data-ready')
    }
  })
  let idMa = q.idMa
  withElem('output-id-ma', e => {
    e.textContent = idMa ? 'ModArchive id: ' + idMa : ''
    e.href = idMa ? urlConfig.pageUrlModArchive + idMa : ''
  })
  withElem('output-title', e => e.textContent = data.title)
  withElem('output-lore', e => e.textContent = data.message)
  // allow resizing only if wide strings are present
  withElem('metadata-resizer', resizer => {
    let isMessageWide = data.message.match(/.{23}/) || data.title.length >= 23
    resizer.hidden = !isMessageWide
    if (isMessageWide) resizer.onpointerdown = resizeInit
  })
}

function copyIdLink(shareButton) {
  let id = shareButton._id
  if (!id) return false
  let url = location.origin + location.pathname + '?id=' + id
  if (state.playerConfig.repeatCount == -1) url += '&repeat'
  if (state.playerConfig.speed != 1) url += '&speed=' + state.playerConfig.speed
  try {
    navigator.clipboard.writeText(url)
  } catch(err) {
    shareButton.textContent = shareButton.getAttribute('data-fail')
    return false
  }
  shareButton.textContent = shareButton.getAttribute('data-ok')
}

// --- resizing max width of metadata panel by dragging

function resizeInit(event) {
  if (event.button) return
  let target = this.parentNode
  let offsetX = target.clientWidth - event.clientX
  let id = event.pointerId
  let endingEvents = ['up', 'leave', 'cancel']
  let resizeEnd = () => {
    window.removeEventListener('pointermove', resizeSet)
    endingEvents.forEach(x => window.removeEventListener('pointer' + x, resizeEnd))
  }
  let resizeSet = e => {
    if (e.pointerId != id) return
    target.style.maxWidth = (offsetX + e.clientX) + 'px'
  }
  window.addEventListener('pointermove', resizeSet)
  endingEvents.forEach(x => window.addEventListener('pointer' + x, resizeEnd))
  event.preventDefault()
}

// --- error 'handling'

async function playOnError(err) {
  console.error(err)
  smashQueue(1)
  if (hasNext()) return playNext()
  return enqOnError(err).then(playNext)
}

async function enqOnError(errorMessage) {
  return enqEntry(pick(playlists.playable.filter(e => e.tags.error)), 0, {title: 'Error!', message: errorMessage})
}

// --- file dropping

function processDroppedFiles(files) {
  files = Array.from(files)
  console.debug('Files dropped:', files.map(file => file.name))
  if (!files || !files[0]) return
  if (!state.fileReader) {
    let reader = new FileReader()
    state.fileReader = reader
    reader.onerror = playOnError
    reader.onload = () => {
      console.debug('Finished reading file:', reader.fileName)
      try {
        addToQueue({
          buffer: reader.result,
          src: reader.fileName,
          color: '#99a',
          solid: 2,
          persist: true,
        })
      } catch (err) {
        playOnError(err)
      }
      reader.processTail()
    }
    reader.processTail = () => {
      if (!reader.tail || !reader.tail.length) return
      let file = reader.tail[0]
      state.fileReader.fileName = file.name
      console.debug('Starting reading file:', file.name)
      reader.readAsArrayBuffer(file)
      reader.tail = reader.tail.slice(1)
    }
  }
	state.fileReader.tail = files
  state.fileReader.processTail()
}

function interceptEvent(e) {
  e.stopPropagation()
  e.preventDefault()
}
window.ondragover = interceptEvent
window.ondrop = e => {
  interceptEvent(e)
  processDroppedFiles(e.dataTransfer.files)
}

// --- init index and playlists

async function loadIndex() {
  await fetch(urlConfig.collectionUrlRoot + urlConfig.indexPathLocal)
    .then(x => x.text())
    .then(parseIndex)
    .then(generatePlaylists)
    .then(createControls)
    .then(ready)
}

function parseIndex(fileContents) {
  fileContents = fileContents.split('\n')
  let index = []
  for (let line of fileContents) {
    let p = line.split('|')
    if (p.length < 8) continue
    let tagList = p[3].split(',')
    let tags = {}
    for (let t of tagList) {
      if (t.indexOf('=') != -1) {
        let tagParts = t.split('=')
        tags[tagParts[0]] = +tagParts[1]
      } else tags[t] = 1
    }
    index.push({
      line,
      md5: p[0],
      c: p[2][0], k: p[2][1], q: p[2][2], m: p[2][3],
      category: p[2],
      tags,
      name: p[4], path: p[5], ext: p[6],
      title: p.length == 8 ? p[7] : p.slice(7).join('|')
    })
  }
  return index
}

let playlists = {}
function generatePlaylists(index) {
  playlists.full = index
  playlists.playable = index.filter(e => playableExts.includes(e.ext))
  playlists.accepted = playlists.playable.filter(e => '0123mn'.includes(e.c))
  // all other playlists are generated lazily
}

function plCode2Function(code) {
  return new Function('e', 'return ' + code.split('|').map(x => x.split(';').map(expr => {
    let m = null
    m = expr.match(/^\.([\w]+)$/)
    if (m) return `e.ext == '${m[1]}'`
    m = expr.match(/^:(\!?)([\w:]+)$/)
    if (m) return `${m[1]}e.tags['${m[2]}']`
    m = expr.match(/^:([\w:]+)\^(\d(\.\d)?|\.\d)$/)
    if (m) return `e.tags['${m[1]}'] >= ${m[2]}`
    m = expr.match(/^([ckqm]):([\w:]+)$/)
    if (m) return `'${m[2]}'.includes(e.${m[1]})`
    throw `Could not recognize playlist expression '${expr}'`
  }).map(x => '(' + x + ')').join(' && ')).join(' || '))
}

state.hourlyRefresh = null
function selectPlaylist(name) {
  selectSourceByName(name)
  smashQueue(1)
  enqNextIfNeeded()
}

function selectSourceByName(name) {
  // dynamic playlist selection handling
  if (name.startsWith('@')) {
    let controlName = name
    let currDate = state.mockDate || new Date()
    let yearDay = currDate.toJSON().slice(5,10)
    name = holidayProgramFull[yearDay] || hourlyProgram[currDate.getHours()]
    if (name == '@event') {
      name = holidayProgramEvent[yearDay] || weekdayProgramEvent[currDate.getDay()]
    }
    let toNextHour = 3600500 - Date.now() % 3600000
    state.hourlyRefresh = setTimeout(() => selectPlaylist(controlName), toNextHour)
  } else if (state.hourlyRefresh) {
    clearTimeout(state.hourlyRefresh)
    state.hourlyRefresh = null
  }
  // special playlist source handling
  if (name.startsWith('!')) {
    let source = name.slice(1)
    if (state.source == source) return
    console.info('Playlist switched to: ' + name)
    state.source = source
    state.sourceName = name
    return
  }
  // define lazy playlist function
  if (!playlists[name]) {
    let code = name
    if (playlistAlias[code]) {
      code = playlistAlias[code]
    }
    let base = playlists.accepted
    if (code.startsWith('*')) {
      base = playlists.playable
      code = code.slice(1)
    }
    playlists[name] = base.filter(plCode2Function(code))
  }
  if (!playlists[name].length) {
    throw `Playlist '${name}' is empty!`
  }
  let source = playlists[name]
  if (state.source == source) return
  console.info('Playlist switched to: ' + name + ' (' + source.length + ' items)')
  state.source = source
  state.sourceName = name
}

// --- finishing init (todo: refactor this all)

function ready() {
  // graffiti: set to ready if not yet
  if (!state.player) setGraffitiStatus('ok')
  // graffiti: add actions on click
  graffiti.addEventListener('click', () => {
    if (!isPlaying()) {
      if (!state.player) {
        playNext()
        return
      }
      state.player.togglePause()
      state.resetPause()
      return
    }
    state.anim.enabled = !state.anim.enabled
    updateGraffitiAnim()
  })
  // about: set dynamic values
  withElem('base-count', e => e.textContent = playlists.accepted.length + (params.more ? ` (${playlists.playable.length})` : ''))
  withElem('supported-exts', e => e.textContent = playableExts.join(', '))
  // params.id: enqueue referenced music
  if (params.id) params.id.forEach(enqById)
  // about: make keybinds in help functional
  document.querySelectorAll('kbd[data]').forEach(elem => {
    let listener = state.keyDownListeners[elem.getAttribute('data')]
    if (!listener) console.error(`Listener '${elem.getAttribute('data')}' specified in <kbd> is not specified!`)
    elem.addEventListener('click', listener)
    elem.addEventListener('mousedown', e => {
      e.preventDefault()
      e.stopPropagation()
    })
    elem.role = 'button'
  })
  // params.autoplay: launch if possible
  if (state.playerConfig.autoplay) {
    // Wasm doesn't load in order so need to wait until it loads and only then start
    // todo: ensure it in launchPlayer
    function playWhenReady() {
      if (!window.wasmExports) return setTimeout(playWhenReady, 10)
      playNext()
    }
    playWhenReady()
  }
}

// --- element utils

function makeElem(parent, tag, init) {
  let elem = document.createElement(tag)
  if (init) init(elem)
  if (parent) parent.appendChild(elem)
  return elem
}

function warnOnce(msg) {
  if (!state.warns) state.warns = {}
  if (state.warns[msg]) return
  console.error(msg)
  state.warns[msg] = true
}

function withElem(id, f) {
  let elem = document.getElementById(id)
  return elem ? f(elem) : warnOnce(`Failed to find element with id='${id}'`)
}

// --- generating controls

function createControls() {
  makeElem(document.body, 'div', controls => {
    controls.className = 'controls'
    createBackButton(controls)
    createPauseButton(controls)
    createNextButton(controls)
    createModeSelect(controls)
    makeElem(controls, 'div', progressRow => createSeekBar(progressRow))
    createOptionalControls(controls)
  })
}

function createPauseButton(parent) {
  createPlayButton(
    parent,
    e => {
      state.resetPause = () => {
        let isPlayingNow = isPlaying()
        e.textContent = ['I>', 'II'][+isPlayingNow]
        e.title = ['Play', 'Pause'][+isPlayingNow] + ' [Space]'
        updateGraffitiAnim()
        navigator.mediaSession.playbackState = isPlayingNow ? 'playing' : 'paused'
      }
      state.resetPause()
    },
    () => {
      if (!state.player) {
        playNext()
      } else {
        state.player.togglePause()
      }
      state.resetPause()
    },
    ['play', 'pause'],
    'Space'
  )
}

function createNextButton(parent) {
  createPlayButton(
    parent,
    e => {
      e.textContent = '>>'
      e.title = 'Next [Arrow Right]'
    },
    () => {
      playNext()
      state.resetPause()
    },
    ['nexttrack'],
    'ArrowRight'
  )
}

function createBackButton(parent) {
  createPlayButton(
    parent,
    e => {
      e.textContent = '<<'
      e.title = 'Back [Arrow Left]'
    },
    () => {
      playBack()
      state.resetPause()
    },
    ['previoustrack'],
    'ArrowLeft'
  )
}

function createPlayButton(parent, init, action, mediaEvents, key) {
  makeElem(parent, 'button', e => {
    init(e)
    e.addEventListener('click', action)
  })
  mediaEvents.forEach(eventName => navigator.mediaSession.setActionHandler(eventName, () => {
    console.debug('Media Event: ' + eventName)
    action()
  }))
  state.keyDownListeners[key] = action
}

function assignSeekKeybinds() {
  let setSeekKeybind = (key, f) => state.keyDownListeners[key] = () => {
    if (!state.player || !state.player.currentPlayingNode) return
    state.player.setCurrentSeconds(f())
  }
  setSeekKeybind('ArrowRightAlt', () => state.player.getCurrentSeconds() + state.playerConfig.rewindStepSeconds)
  setSeekKeybind('ArrowLeftAlt', () => state.player.getCurrentSeconds() - state.playerConfig.rewindStepSeconds)
  setSeekKeybind('ArrowRightShift', () => state.player.getTotalSeconds() - state.playerConfig.rewindTailSeconds)
  setSeekKeybind('ArrowLeftShift', () => 0)
}

function createSeekBar(row) {
  row.id = 'progress-row'
  row.className = 'range-row'
  makeElem(row, 'input', bar => {
    bar.type = 'range'
    bar.id = 'seekbar'
    state.seekbar = bar
    bar.oninput = () => {
      if (!state.player) return
      let t = bar.value * state.playerConfig.seekPrecision
      state.player.setCurrentSeconds(t)
    }
  })
  makeElem(row, 'span', e => {
    state.progressNow = e
    e.id = 't-now'
    // copy current time in seconds on click (useful for adding t:end)
    e.onclick = () => {
      if (!state.player) return
      navigator.clipboard.writeText(state.player.getCurrentSeconds().toFixed(1))
    }
  })
  makeElem(row, 'span', e => {
    state.progressFull = e
    e.id = 't-end'
  })
  row.hidden = true
  state.progressRow = row
  assignSeekKeybinds()
}

function durationToString(t) {
  let seconds = Math.floor(t)
  let minutes = Math.floor(seconds / 60)
  seconds -= minutes * 60
  let s = seconds.toString()
  if (s.length < 2) s = '0' + s
  let m = minutes.toString()
  if (m.length < 2) m = '0' + m
  return m + ':' + s
}

function resetProgress() {
  let duration = state.player.getTotalSeconds()
  state.seekbar.max = Math.ceil(duration / state.playerConfig.seekPrecision)
  state.seekbar.min = 0
  state.seekbar.value = 0
  state.progressRow.hidden = false
  state.progressNow.textContent = durationToString(0)
  state.progressFull.textContent = durationToString(Math.ceil(duration))
}

function updateProgress() {
  let t = state.player.getCurrentSeconds()
  state.seekbar.value = Math.round(t / state.playerConfig.seekPrecision)
  state.progressNow.textContent = durationToString(t)
}

function createModeSelect(parent) {
  makeElem(parent, 'select', select => {
    for (let mode of modes) makeElem(select, 'option', opt => {
      opt.value = mode.p
      // prepend tiny space or else emoji's left side gets cut
      opt.textContent = '\u2005' + mode.name
      if (mode.title) opt.title = mode.title
      if (mode.hidden && mode.hidden - !!(params.more)) opt.hidden = true
    })
    select.title = 'Select Mode/Playlist'
    select.addEventListener('change', () => {
      let p = select.value
      selectPlaylist(p)
      localStorage['playgen:mode'] = p
    })
    // pre-select playlist mode from url params
    let urlPlaylistModeParam = params.pl
    if (urlPlaylistModeParam) {
      try {
        selectPlaylist(urlPlaylistModeParam)
        select.value = modes.find(x => x.p == urlPlaylistModeParam) ? urlPlaylistModeParam : 'custom'
        return
      } catch (err) {
        console.error(err)
      }
    }
    // if not, then pre-select playlist mode from last time
    select.value = localStorage['playgen:mode'] || '@auto'
    selectPlaylist(select.value)
  })
}

function createOptionalControls(parent) {
  makeElem(parent, 'details', parent => {
    parent.hidden = true
    makeElem(parent, 'summary', summary => {
      summary.id = 'more-options'
      summary.textContent = '···'
      summary.title = 'More options...'
    })
    makeElem(parent, 'div', createVolumeBar)
    makeElem(parent, 'div', createSpeedBar)
    makeElem(parent, 'div', parent => {
      createLoopCheckbox(parent)
      createSeqCheckbox(parent)
      createFileButton(parent)
    })
    makeElem(parent, 'div', parent => {
      createFilterSelect(parent)
      createGraphButton(parent)
      createBufferSelect(parent)
    })
  })
}

function createVolumeBar(row) {
  createRangeBar(
    row,
    '🔈 🔉 🔊',
    'Volume',
    v => {if (state.player) state.player.setVolumeGainMillibells(v)},
    () => state.playerConfig.volume,
    v => state.playerConfig.volume = v,
    state.playerConfig.volumeMin,
    state.playerConfig.volumeMax,
    state.playerConfig.volumeStep,
    state.playerConfig.volumePrecision,
    'Minus,Equal,Backslash'
  )
}

function createSpeedBar(row) {
  createRangeBar(
    row,
    '🧊 🐌 🐢 🐇 🐎 ✈️ 🚀',
    'Playback speed',
    null,
    () => Math.log2(state.playerConfig.speed),
    v => state.playerConfig.speed = 2 ** v,
    state.playerConfig.speedExpMin,
    state.playerConfig.speedExpMax,
    state.playerConfig.speedExpStep,
    state.playerConfig.speedExpPrecision,
    'ArrowDownAlt,ArrowUpAlt,SlashAlt'
  )
}

function createRangeBar(row, iconSet, title, apply, getConfig, setConfig, min, max, step, precision, keys) {
  iconSet = iconSet.split(' ')
  row.className = 'range-row'
  let marker = makeElem(row, 'span', marker => {
    marker.className = 'range-icon'
    marker.role = 'button'
    marker.title = 'Reset ' + title.toLowerCase() + ' to default'
    marker.onclick = reset
  })
  let input = makeElem(row, 'input', input => {
    input.type = 'range'
    input.min = min / precision
    input.max = max / precision
    input.title = title
    input.oninput = () => {
      setConfig(input.value * precision)
      resetValue()
    }
  })
  makeElem(row, 'span', marker => {
    marker.className = 'range-spacer'
    marker.textContent = iconSet[iconSet.length - 1]
  })
  function resetInput() {
    input.value = getConfig() / precision
    resetValue()
  }
  function resetValue() {
    if (apply) apply(getConfig())
    let normed = (input.value - input.min) / (input.max - input.min)
    let icon = iconSet[Math.min(Math.max(Math.floor(normed * iconSet.length), 0), iconSet.length - 1)]
    marker.textContent = icon
  }
  function reset() {
    setConfig(0)
    resetInput()
  }
  resetInput()
  keys = keys.split(',')
  state.keyDownListeners[keys[0]] = () => {
    setConfig(Math.max(getConfig() - step, min))
    resetInput()
  }
  state.keyDownListeners[keys[1]] = () => {
    setConfig(Math.min(getConfig() + step, max))
    resetInput()
  }
  state.keyDownListeners[keys[2]] = reset
}

function createLoopCheckbox(parent) {
  createCheckbox(
    parent,
    state.playerConfig.repeatCount == -1,
    v => {
      state.playerConfig.repeatCount = -v
      if (state.player) state.player.setRepeatCount(-v)
    },
    'Loop',
    'Repeat current track endlessly, and seamlessly if track supports this'
  )
}

function createSeqCheckbox(parent) {
  createCheckbox(
    parent,
    !state.playerConfig.sequentially,
    v => {
      state.playerConfig.sequentially = !v
      if (!state.player || !state.queue.length) return
      smashQueue(1)
      enqNextIfNeeded(state.queue[state.queue.length - 1])
    },
    'Shuffle',
    'Pick random tracks from playlist. When disabled, same order as in collection index will always be used'
  )
}

function createCheckbox(parent, initValue, setAndApply, name, title) {
  makeElem(parent, 'button', button => {
    button.textContent = name
    button._value = initValue
    button.title = title
    function resetButton() {
      button.className = button._value
    }
    button.onclick = () => {
      button._value = !button._value
      setAndApply(button._value)
      resetButton()
    }
    resetButton()
  })
}

function createFileButton(parent) {
  makeElem(parent, 'button', button => {
    button.textContent = 'File'
    button.title = [
      'Select your module tracking music files to play (or just drag and drop them)',
      'Supported file formats: ' + playableExts.join(', ')
    ].join('\n')
    button.onclick = () => {
      let input = makeElem(parent, 'input', input => {
        input.type = 'File'
        input.accept = playableExts.map(x => '.' + x).join(',')
        input.multiple = true
        input.hidden = true
      })
      function finalize() {
        parent.removeChild(input)
      }
      function pickFiles() {
        if (input.files.length) processDroppedFiles(input.files)
        finalize()
      }
      input.addEventListener('cancel', finalize)
      input.addEventListener('change', pickFiles)
      input.click()
    }
  })
}

function createFilterSelect(parent) {
  let filterValues = [
    {name: 'No filter', value: 'none', description: 'Original raw audio as is'},
    {name: 'Smoothed', value: 'smooth', description: 'Sharp noise suppression (experimental)'},
  ]
  makeElem(parent, 'select', select => {
    for (let filter of filterValues) makeElem(select, 'option', opt => {
      opt.value = filter.value
      opt.textContent = '\u2005' + filter.name
      opt.title = filter.description
    })
    select.title = 'Filter for audio post-processing (experimental)'
    select.value = localStorage['playgen:filter'] || 'none'
    select.addEventListener('change', () => {
      let filter = select.value
      state.playerConfig.smoothing = filter == 'smooth' ? 80 : 0
      localStorage['playgen:filter'] = filter
    })
  })
}

function createBufferSelect(parent) {
  makeElem(parent, 'select', select => {
    for (let k = 8; k <= 14; k++) makeElem(select, 'option', opt => {
      let bufferSize = 2 ** k
      opt.value = bufferSize
      opt.textContent = '\u2005' + bufferSize
    })
    select.title = 'Buffer size (how many sample points are generated and processed at once)'
    select.value = state.playerConfig.bufferSize
    select.addEventListener('change', () => {
      let bufferSize = select.value
      state.playerConfig.bufferSize = bufferSize
      if (state.player) state.player.recreate()
      localStorage['playgen:bufferSize'] = bufferSize
    })
  })
}

function createGraphButton(parent) {
  function resetGraph(useGraph) {
    let canv = document.getElementById('oscilloscope')
    if (useGraph) {
      if (!canv) {
        canv = makeElem(document.body, 'canvas', canv => {
          canv.id = 'oscilloscope'
          state.playerConfig.graphParams.canvas = canv
          canv.width = state.playerConfig.graphParams.w
          canv.height = state.playerConfig.graphParams.h
        })
      }
    }
    if (canv) canv.hidden = !useGraph
  }
  makeElem(parent, 'button', e => {
    e.textContent = '📈'
    e.title = 'Toggle wave graph output'
    e.addEventListener('click', () => {
      let useGraph = !state.playerConfig.useGraph
      state.playerConfig.useGraph = useGraph
      resetGraph(useGraph)
    })
  })
  resetGraph(state.playerConfig.useGraph)
}

// --- key handling

window.addEventListener('keydown', e => {
  let key = e.code
  if (e.shiftKey) key += 'Shift'
  if (e.ctrlKey) key += 'Ctrl'
  if (e.altKey) key += 'Alt'
  let listener = state.keyDownListeners[key]
  if (listener) {
    listener(e)
    e.preventDefault()
  }
})

// --- url params handling

function parseUrlParams() {
  let raw = location.search.slice(1)
  if (!raw) return {}
  let params = {id: []}
  raw.split('&').forEach(kv => {
    let splitIndex = kv.indexOf('=')
    if (splitIndex == -1) {
      params[kv] = true
    } else {
      let k = kv.slice(0, splitIndex)
      let v = kv.slice(splitIndex + 1)
      if (typeof params[k] == 'object') {
        params[k].push(v)
      } else {
        params[k] = v
      }
    }
  })
  if (!params.id.length) delete params.id
  return params
}

// --- session management

function saveSession() {
  if (!state.player) return
  let q = state.queue[state.queueIndex]
  if (!q || !q.id || q.customMetadata) return
  if (state.playerConfig.restoreOnRefreshOnlyIfPlaying && !isPlaying()) return
  localStorage['playgen:session'] = JSON.stringify({
    id: [q.id],
    t: state.player.getCurrentSeconds(),
    speed: state.playerConfig.speed,
    volume: state.playerConfig.volume,
    anim: state.anim.enabled,
    autoplay: isPlaying(),
    pl: state.sourceName == params.pl ? params.pl : null,
    exp: Date.now() + state.playerConfig.restoreOnRefreshExpireMs
  })
}

function loadSession() {
  if (!params.id && !params.t) setSession(localStorage['playgen:session'])
  delete localStorage['playgen:session']
}

function setSession(s) {
  if (!s) return
  try {
    s = JSON.parse(s)
    if (s.exp && Date.now() > s.exp) return
    if (params.pl && s.pl != params.pl) return
    delete s.exp
    Object.assign(params, s)
  } catch(err) {
    console.error('Invalid session JSON:', err)
  }
}

function initSession() {
  loadSession()
  window.addEventListener('beforeunload', saveSession)
}

// --- ambient coloring

function setPlayingStyle(q) {
  console.info('Playing:', q.e ? q.e.line : q.src)
  console.debug('Queue pos:', state.queue.indexOf(q) + 1, '/', state.queue.length)
  setAmbientColor(q.color ? q.color : '#aaa')
}
function setAmbientColor(ambientColor) {
  withElem('ambient', style => style.textContent = 'html{--ambient:'+ambientColor+';}')
}

// --- graffiti animations

function setAnimPeriod(period) {
  withElem('period', style => style.textContent = '.leaf{--period:'+period+'s;}')
}

const graffitiText = {
  loading: 'Loading',
  ok: 'Playgen',
  error: '[error]',
}
function createGraffiti() {
  state.graffiti = makeElem(document.body, 'pre', graffiti => {
    for (let i = 0; i < graffitiText.ok.length; i++) {
      makeElem(graffiti, 'span', e => {
        e.className = 'leaf'
        e.style.animationDelay = -i / 8 + 's'
      })
    }
    graffiti.id = 'graffiti'
  })
  setGraffitiStatus('loading')
}

function setGraffitiStatus(status) {
  let text = graffitiText[status]
  Array.from(state.graffiti.children).forEach((e, i) => e.textContent = text[i])
  state.graffiti.classList[['add', 'remove'][+(status != 'loading')]]('loading')
}

function updateGraffitiAnim() {
  let enabled = state.anim.enabled && isPlaying()
  if (enabled != state.anim.state) {
    state.graffiti.classList[['add', 'remove'][+state.anim.state]]('waving')
    state.anim.state = enabled
  }
  if (enabled) {
    if (!state.anim.timer) {
      state.anim.timer = setInterval(updateGraffitiAnim, 100)
    }
  } else {
    if (state.anim.timer) {
      clearInterval(state.anim.timer)
      state.anim.timer = null
    }
    return
  }
  let period = state.player.getCurrentTicksPerRow()
  if (state.anim.currPeriod == period) return
  state.anim.currPeriod = period
  setAnimPeriod(period)
}

// --- coloring by category

function category_to_rgb15(x0, x2, x3) {
  let c0 = +x0 || 0
  let c = 2 + 2 * Math.min(c0, 1)
  let c3 = c * 3 + Math.max(c0, 1) - 2
  let n = +x2 || 0 // 012345
  let n2 = Math.abs(3 - n) // 321012
  let nm = n * (2 + (x0 != 'n')) // n:02468a m:039cf
  let mood = +x3 || 0
  let r = n == 0 && x0 != 'n' ? 2 * mood + 5 * (x3 == 'a') : Math.min(Math.max(11 - nm + c3, 0), 15)
  let g = Math.max(n2 * 2 + mood, Math.floor(c3 * (5 - n) / 5))
  let b = Math.min(Math.min(Math.max(nm - 4, 0), 8) + 4 * (x0 == 'm') + (4 + 2 * c) * (x2 == 'm') + n * mood, 15)
  if (mood >= 1) {
    let d = Math.max(Math.min(mood*3, 6 - b, r - 6), 0)
    r -= d
    g += d / 2
    let avg = (r + b + g) / 3
    let t1 = mood + 4
    let t0 = mood * (avg - 1)
    r = Math.min(Math.max(Math.floor((r * t1 - t0) / 4), 0), 15)
    g = Math.min(Math.max(Math.floor((g * t1 - t0) / 4), 0), 15)
    b = Math.min(Math.max(Math.floor((b * t1 - t0) / 4), 0), 15)
  } else
  if (x3 == '0') {
    let avg = (r + b + g) / 3
    r = Math.floor((r*7+avg)/8)
    g = Math.floor((g*7+avg)/8)
    b = Math.floor((b*7+avg)/8)
  } else
  if (x3 == 's') {
    let avg = (r + b + g) / 3
    r = Math.floor((r+avg)/2)
    g = Math.floor((g+avg)/2)
    b = Math.floor((b+avg)/2)
  } else
  if (x3 == 'w') {
    r = Math.min(r + 5, 15)
    g = Math.ceil(g / 2)
    b = Math.ceil(b / 2)
  } else
  if (x3 == 'u') {
    b = Math.min(b + 3, 15)
  }
  return [r,g,b]
}

function category_to_color(x0, x2, x3) {
  return '#' + category_to_rgb15(x0, x2, x3).map(x => x.toString(16)).join('')
}

// --- obligatory bubbles

function createIntroBeepBlob() {
  const durationSeconds = 5
  const sampleRate = 44100
  const numSamples = durationSeconds * sampleRate
  const buffer = new Int16Array(numSamples)

  let freqA = 250
  let freqB = 500
  let period = 0.1
  let vol = 0.1

  let phi = 0
  for (let i = 0; i < numSamples; i++) {
    let tt = ((i / sampleRate) % period) / period
    let freq = (1-tt)*freqA + tt*freqB
    phi += freq / sampleRate
    let bubble = 1 - (2*tt - 1)**6
    let v = Math.sin(phi * 2 * Math.PI) * vol * bubble
    buffer[i] = Math.floor(v * 0x8000)
  }

  let header = atob('UklGRsy6BgBXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0Yai6BgA=')
  header = Uint8Array.from(header.split('').map(x => x.charCodeAt(0)))
  return new Blob([header, buffer], {type: 'audio/wav'})
}

async function createFakeAudioToMakeMediaSessionWork() {
  // making audio element with src and non-silent content,
  // otherwise mediaSession for some weird reason is ignored
  const audioElem = document.createElement('audio')
  document.body.appendChild(audioElem)
  let blob = createIntroBeepBlob()
  audioElem.src = URL.createObjectURL(blob)
  audioElem.loop = true
  // but at least we can pause it
  // however on chromium pause events will be ignored then
  audioElem.onplay = () => setTimeout(() => audioElem.pause(), state.playerConfig.bubbleIntroMs)
  return audioElem.play()
}

function linkMail() {
  withElem('about-container', c => withElem('mail', raw =>
      c.addEventListener('toggle', () => {
      let link = raw.textContent.replace(/\(at\)/,'@').replace(/\(dot\)/,'.')
      raw.replaceWith(makeElem(null, 'a', a => a.href = 'mailto:' + (a.textContent = link)))
    })
  ))
}

// --- run startup

createGraffiti()
loadIndex()
linkMail()
