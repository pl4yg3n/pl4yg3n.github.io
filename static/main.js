'use strict'
const libopenmpt = {}

const urlParams = parseUrlParams()

// --- playing program config

const modes = [
  {name: '📀 Auto', p: '@auto', title: 'Automatically selects playlist depending on time of the day'},
  {name: '🎲 All', p: 'accepted', title: 'Random music from full playable collection'},

  {name: '🏙️ Day', p: 'day', title: 'Active musical tracks usually played during day'},
  {name: '🌇 Evening', p: 'night_1', title: 'Musical tracks usually played around 21:00'},
  {name: '🌆 Twilight', p: 'night_2', title: 'Partially calm tracks usually played around 22:30'},
  {name: '🌉 Night', p: 'night_wide', title: 'Calm tracks usually played from 22:00 to 06:00'},
  {name: '🌃 Midnight', p: 'night_4', title: 'Calm tracks usually played from 00:00 to 05:00'},
  {name: '🌄 Morning', p: 'morning_2', title: 'Active tracks usually played around 09:00'},

  {name: '🌌 Cosmical', p: ':cosm', title: 'Coolest spacious cosmical music for imagination (best themed playlist!)'},
  {name: '🍹 Cozy', p: 'group_cozy'},
  {name: '🛩️ Flight', p: ':flight'},
  {name: '✨ Shiny', p: 'group_shiny'},
  {name: '🧼 Dishwash', p: ':rld', title: 'A few calm same-style tracks for monotonous work'},
  {name: '🎸 Rock', p: ':rock'},
  {name: '📼 Remix', p: 'group_remix', title: 'Remixes & remakes'},
  {name: '🎃 Pumpkin', p: 'group_pumpkin', title: 'Some mildly witchy & spooky tracks'},
  {name: '🍰 Happy', p: 'mood_gold', title: 'Happy music to cheer up ^^'},
  {name: '🌧️ Sorrow', p: ':sorrow', title: 'Sad tracks to comfort you'},

  {name: '👍 Good', p: 'day_good', title: 'Collection of pretty good tracks, usually played from 14:00 to 17:00'},
  {name: '🏅 Gold', p: 'day_gold', title: 'Golden collection, usually played from 15:00 to 16:00'},
  {name: '👑 Best', p: 'day_best', title: 'Collection of best masterpieces'},

  {name: '🏛️ ModArchive', p: '!ma:random', title: 'Random music from modarchive.org - a huge external collection of over 170K tracks!'},
  
  {name: '🛠️ Custom', p: 'custom', title: 'Custom playlist', hidden: true}
]
const hourlyProgram = [
  /* 00: */ 'night_4',
  /* 01: */ 'night_5',
  /* 02: */ 'night_5',
  /* 03: */ 'night_5',
  /* 04: */ 'night_4',
  /* 05: */ 'night_wide',
  /* 06: */ 'morning_1',
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
  different: '*c:d',
  unaccepted: '*c:u',
}

// --- player config

const playableExts = ['xm', 'mod', 'it', 's3m', 'fc13', 'fc14', 'mo3', 'mtm', 'mptm'] // openmpt can play only those
// Well, actually...
// Formats supported by https://lib.openmpt.org/libopenmpt/2025/05/31/release-0.8.0/:
// mptm, mod, s3m, xm, it, 667, 669, amf, ams, c67, cba, dbm, digi, dmf, dsm, dsym, dtm,
// etx, far, fc, fc13, fc14, fmt, fst, ftm, imf, ims, ice, j2b, m15, mdl, med, mms, mt2, mtm, mus,
// nst, okt, plm, psm, pt36, ptm, puma, rtm, sfx, sfx2, smod, st26, stk, stm, stx, stp, symmod,
// gmc, gtk, gt2, ult, unic, wow, xmf, gdm, mo3, oxm, umx, xpk, ppm, mmcmp

const urlConfig = {
  collectionUrlRoot: (location.hostname == 'localhost') ? './collection/'
    : 'https://raw.githubusercontent.com/pl4yg3n/collection/refs/heads/main/',
  indexPathLocal: 'index.csv',
  musicPathLocal: 'data/',
  musicUrlModArchive: 'https://api.modarchive.org/downloads.php?moduleid=',
  pageUrlModArchive: 'https://modarchive.org/index.php?request=view_by_moduleid&query=',
  modArchiveMaxId: 212068,
}
const state = {
  playerConfig: {
    bufferSize: Math.abs(+urlParams['buffer'] || 2**14),
    repeatCount: (x => x === true ? -1 : +x)(urlParams['repeat']) || null,
    smoothing: Math.abs(+urlParams['smoothing'] || 0),
    speed: Math.abs(+urlParams['speed'] || 1),
    speedStep: 2 ** (1/8),
    volume: Math.min(+urlParams['volume'] || 0, 0),
    volumeStep: 250,
    volumeMax: 0,
    rewindStepSeconds: 5,
    rewindTailSeconds: 20,
    sequentially: !!urlParams['seq'],
    autoplay: !!urlParams['autoplay'],
  },
  player: null,
  queue: [],
  queueIndex: -1,
  source: null,
  anim: {
    enabled: false,
    state: false,
    timer: null,
  },
  keyDownListeners: {},
}

// --- playing logic

async function launchPlayer() {
  if (state.playerConfig.audioElem) {
    state.playerConfig.audioElem = makeElem(makeElem(state.controls, 'div'), 'audio', audio => {
      audio.controls = true
      audio.addEventListener('ended', playNext)
    })
  } else {
    // should be before player init, because need to fail-fast on autoplay blocking
    await createFakeAudioToMakeMediaSessionWork()
  }
  state.player = new ChiptuneJsPlayer(state.playerConfig)
  if (!state.playerConfig.audioElem) {
    state.player.onEnded = playNext
  }
}

function hasNext() {
  return state.queueIndex + 1 < state.queue.length
}

async function playNext() {
  if (!state.player) await launchPlayer()
  navigator.mediaSession.metadata = new MediaMetadata({
    artwork: [
      {src: './static/img/pkey.svg', sizes: '256x256,512x512', type: 'image/svg+xml'},
      {src: './static/img/pkey256.png', sizes: '256x256', type: 'image/png'},
    ]
  })
  loadNextIfNeeded()
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

function loadNextIfNeeded(hint) {
  if (!hasNext()) loadNext(hint)
}

async function loadNext(hint) {
  if (!state.player) return
  if (!state.source) return
  if (typeof state.source == 'string') {
    if (state.source == 'ma:random') {
      return enqMa(0, 0).catch(err => {
        if (err == 'Invalid response') {
          loadNextIfNeeded()
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
    if (hint) {
      let index = arr.indexOf(hint) + 1
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
  return enqEntry(pick(playlists.full.filter(x=>x.md5==query || x.title.includes(query))))
    .then(q => {console.info('Enqueued:', q); return q})
}

async function enqById(id) {
  if (id.startsWith('ma:')) return enqMa(id.slice(3), 3)
  return enqEntry(pick(playlists.full.filter(x=>x.md5.startsWith(id))), 3)
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

async function enqEntry(e, solid=1, customMetadata) {
  return addToQueue({
    e,
    src: urlConfig.collectionUrlRoot + urlConfig.musicPathLocal + e.path.replaceAll('%', '%25').replaceAll('#', '%23'),
    color: category_to_color(e.c, e.q, e.m),
    insn: {start: e.tags['t:start'], end: e.tags['t:end'], repeat: e.tags['repeat']},
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
  let currentIndex = state.queueIndex
  let q = state.queue[currentIndex]
  if (!q) {
    throw 'Queue is empty at current index!'
  }
  if (!q.prepared) {
    if (!q.solid) q.solid = 1
    q.prepared = q.loaded.then(q => playQueueItem(q, currentIndex))
  }
  return q.prepared
}

function playQueueItem(q, currentIndex) {
  q.prepared = null
  if (!q || !q.buffer) {
    if (q) unlistQueueItem(q)
    throw 'Cannot play what is not loaded!'
  }
  if (q.queueIndex != currentIndex) {
    throw 'Queue item tried to play out of order (probably was skipped during loading)!'
  }
  q.played = true
  setPlayingStyle(q)
  try {
    state.player.play(q.buffer, q.insn)
    displayMetadata(q)
  } catch (err) {
    unlistQueueItem(q)
    playOnError(err)
  }
  // todo: unload buffer after another play
  //if (!q.persist) q.buffer = null
  state.resetPause()
  loadNextIfNeeded(q.e)
  return q
}

function unlistQueueItem(q) {
  let queueIndex = state.queue.indexOf(q)
  if (queueIndex != -1) {
    let removed = state.queue.splice(queueIndex, 1)
    console.debug('Removed from queue:', removed[0], 'at index', queueIndex)
    if (state.queueIndex == queueIndex) {
      state.resetPause()
      //playNext()
    }
    if (state.queueIndex >= queueIndex) state.queueIndex--
  } else {
    console.debug('Failed to remove from queue:', q)
  }
}

// --- metadata output

async function displayMetadata(q) {
  let data = q.customMetadata || state.player.metadata()
  document.getElementById('metadata-container').hidden = false
  document.getElementById('output-id').textContent = q.id ? 'id: ' + q.id : (q.src || '')
  let shareButton = document.getElementById('share-id')
  shareButton.hidden = !q.id
  if (q.id) {
    shareButton._id = q.id
    shareButton.textContent = shareButton.getAttribute('data-ready')
  }
  let idMa = q.idMa
  document.getElementById('output-id-ma').textContent = idMa ? 'ModArchive id: ' + idMa : ''
  document.getElementById('output-id-ma').href = idMa ? urlConfig.pageUrlModArchive + idMa : ''
  document.getElementById('output-title').textContent = data.title
  document.getElementById('output-lore').textContent = data.message
  // allow resizing only if wide strings are present
  let resizer = document.getElementById('metadata-resizer')
  let isMessageWide = data.message.match(/.{23}/) || data.title.length >= 23
  resizer.hidden = !isMessageWide
  if (isMessageWide) resizer.onpointerdown = resizeInit
}

function copyIdLink(shareButton) {
  let id = shareButton._id
  if (!id) return false
  let urlPrefix = location.origin + location.pathname + '?id='
  try {
    navigator.clipboard.writeText(urlPrefix + id)
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
  return enqEntry(pick(playlists.playable.filter(e => e.tags.error)), 0, {title:'Error!', message: errorMessage})
}

// --- file dropping

function processDroppedFiles(files) {
  console.debug('Files dropped:', files.map(file => file.name))
  if (!files || !files[0]) return
  if (!state.fileReader) {
    let reader = new FileReader()
    state.fileReader = reader
    reader.onerror = playOnError
    reader.onload = () => {
      console.debug('Finished reading file:', reader.fileName)
      try {
        let wasNext = hasNext()
        addToQueue({
          buffer: reader.result,
          src: reader.fileName,
          color: '#99a',
          solid: 2,
          persist: true,
        })
        if (!wasNext) playNext()
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
  processDroppedFiles(Array.from(e.dataTransfer.files))
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
    m = expr.match(/^:([\w:]+)$/)
    if (m) return `e.tags['${m[1]}']`
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
  loadNextIfNeeded()
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
}

function ready() {
  Array.from(graffiti.children).forEach((e, i) => e.textContent = graffitiTextDone[i])
  graffiti.addEventListener('click', () => {
    if (!state.player) {
      playNext()
      return
    }
    state.anim.enabled = !state.anim.enabled
    updateGraffitiAnim()
  })
  document.getElementById('base-count').textContent = playlists.accepted.length
  document.getElementById('supported-exts').textContent = playableExts.join(', ')
  // enqueue referenced music
  if (urlParams['id'] && urlParams['id'].length) urlParams['id'].forEach(enqById)
  // make keybinds in help functional
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

function isPlaying() {
  return state.player && state.player.currentPlayingNode && !state.player.currentPlayingNode.paused
}

// --- generating functional elements

function makeElem(parent, name, init) {
  let elem = document.createElement(name)
  if (init) init(elem)
  if (parent) parent.appendChild(elem)
  return elem
}

function createControls() {
  state.controls = makeElem(document.body, 'div', controls => {
    controls.className = 'controls'
    createBackButton(controls)
    createPauseButton(controls)
    createNextButton(controls)
    assignKeyboardControls()
    generateModeSelect(controls)
  })
}

function createPauseButton(parent) {
  function action() {
    if (!state.player) {
      playNext()
    } else {
      state.player.togglePause()
    }
    state.resetPause()
  }

  makeElem(parent, 'button', e => {
    state.resetPause = () => {
      let isPlayingNow = isPlaying()
      e.textContent = ['I>', 'II'][+isPlayingNow]
      e.title = ['Play', 'Pause'][+isPlayingNow] + ' [Space]'
      updateGraffitiAnim()
      navigator.mediaSession.playbackState = isPlayingNow ? 'playing' : 'paused'
      /*
      let decoration = '::'
      let titleElem = document.head.querySelector('title')
      let titleRaw = titleElem.textContent.replaceAll(decoration, '').trim()
      let decorationNow = decoration.repeat(isPlayingNow)
      titleElem.textContent = decorationNow + ' ' + titleRaw + ' ' + decorationNow
      */
    }
    e.addEventListener('click', action)
    state.resetPause()
  })
  navigator.mediaSession.setActionHandler('play', () => {
    console.log('Media Event: play')
    action()
  })
  navigator.mediaSession.setActionHandler('pause', () => {
    console.log('Media Event: pause')
    action()
  })
  state.keyDownListeners['Space'] = action
}

function createNextButton(parent) {
  function action() {
    playNext()
    state.resetPause()
  }

  makeElem(parent, 'button', e => {
    e.textContent = '>>'
    e.title = 'Next [Arrow Right]'
    e.addEventListener('click', action)
  })
  navigator.mediaSession.setActionHandler('nexttrack', () => {
    console.log('Media Event: nexttrack')
    action()
  })
  state.keyDownListeners['ArrowRight'] = action
}

function createBackButton(parent) {
  function action() {
    playBack()
    state.resetPause()
  }

  makeElem(parent, 'button', e => {
    e.textContent = '<<'
    e.title = 'Back [Arrow Left]'
    e.addEventListener('click', action)
  })
  navigator.mediaSession.setActionHandler('previoustrack', () => {
    console.log('Media Event: previoustrack')
    action()
  })
  state.keyDownListeners['ArrowLeft'] = action
}

function assignKeyboardControls() {
  state.keyDownListeners['ArrowRightAlt'] = () => {
    if (!state.player || !state.player.currentPlayingNode) return
    state.player.setCurrentSeconds(state.player.getCurrentSeconds() + state.playerConfig.rewindStepSeconds)
  }
  state.keyDownListeners['ArrowLeftAlt'] = () => {
    if (!state.player || !state.player.currentPlayingNode) return
    state.player.setCurrentSeconds(state.player.getCurrentSeconds() - state.playerConfig.rewindStepSeconds)
  }
  state.keyDownListeners['ArrowRightShift'] = () => {
    if (!state.player || !state.player.currentPlayingNode) return
    state.player.setCurrentSeconds(state.player.getTotalSeconds() - state.playerConfig.rewindTailSeconds)
  }
  state.keyDownListeners['ArrowLeftShift'] = () => {
    if (!state.player || !state.player.currentPlayingNode) return
    state.player.setCurrentSeconds(0)
  }
  state.keyDownListeners['ArrowUpAlt'] = () => {
    state.playerConfig.speed *= state.playerConfig.speedStep
  }
  state.keyDownListeners['ArrowDownAlt'] = () => {
    state.playerConfig.speed /= state.playerConfig.speedStep
  }
  state.keyDownListeners['SlashAlt'] = () => {
    state.playerConfig.speed = 1
  }
  state.keyDownListeners['Minus'] = () => {
    state.playerConfig.volume -= state.playerConfig.volumeStep
    state.player.setVolumeGainMillibells(state.playerConfig.volume)
  }
  state.keyDownListeners['Equal'] = () => {
    state.playerConfig.volume += state.playerConfig.volumeStep
    if (state.playerConfig.volume > state.playerConfig.volumeMax) {
      state.playerConfig.volume = state.playerConfig.volumeMax
    }
    state.player.setVolumeGainMillibells(state.playerConfig.volume)
  }
}

function generateModeSelect(parent) {
  makeElem(parent, 'select', select => {
    for (let mode of modes) makeElem(select, 'option', opt => {
      opt.value = mode.p
      // prepend tiny space or else emoji's left side gets cut
      opt.textContent = '\u2005' + mode.name
      if (mode.title) opt.title = mode.title
      if (mode.hidden) opt.hidden = true
    })
    select.title = 'Select Mode/Playlist'
    select.addEventListener('change', () => {
      let p = select.value
      selectPlaylist(p)
      localStorage['playgen:mode'] = p
    })
    // pre-select playlist mode from url params
    let urlPlaylistModeParam = urlParams['pl']
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
  return params
}

// --- ambient coloring

let ambientStyle = document.getElementById('ambient')
function setPlayingStyle(q) {
  console.info('Playing:', q.e ? q.e.line : q.src)
  console.debug('Queue pos:', state.queue.indexOf(q) + 1, '/', state.queue.length)
  setAmbientColor(q.color ? q.color : '#aaa')
}
function setAmbientColor(ambientColor) {
  ambientStyle.textContent = 'html{--ambient:'+ambientColor+';}'
}

// --- animations

function setAnimPeriod(period) {
  document.getElementById('period').textContent = '.leaf{--period:'+period+'s;}'
}

let graffiti = null
const graffitiTextLoad = 'Loading'
const graffitiTextDone = 'Playgen'
function createGraffiti() {
  graffiti = document.createElement('pre')

  let text = graffitiTextLoad

  text.split('').forEach((c, i) => {
    let e = document.createElement('span')
    e.className = 'leaf'
    e.textContent = c
    e.style.animationDelay = -i / 8 + 's'
    graffiti.appendChild(e)
  })
  graffiti.className = 'graffiti'

  document.body.appendChild(graffiti)
}
function updateGraffitiAnim() {
  let enabled = state.anim.enabled && isPlaying()
  if (enabled != state.anim.state) {
    graffiti.classList[['add', 'remove'][+state.anim.state]]('waving')
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
  let period = libopenmpt._openmpt_module_get_current_speed(state.player.currentPlayingNode.modulePtr) / 3.2 / state.playerConfig.speed
  if (state.anim.currPeriod == period) return
  state.anim.currPeriod = period
  setAnimPeriod(period)
}

// --- coloring by category

function category_to_rgb15(x0, x2, x3) {
  let c = [2,4,5][Math.min((+x0||0), 2)]
  let n = +x2||0 // 012345
  let n2 = Math.abs(3 - n) // 321012
  let nm = n*(2+1*(x0!='n')) // n:02468a m:039cf
  let mood = 1*(+x3||0)
  let r = n == 0 ? 0 : Math.min(Math.max(11 - nm + c*3, 0), 15)
  let g = Math.max(n2 * 2 + mood, Math.floor(c * (15 - n * 3) / 5))
  let b = Math.min(Math.min(Math.max(nm-4, 0), 8) + 4*(x0=='m') + (4+2*c)*(x2=='m') + n*mood, 15)
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
  audioElem.onplay = () => setTimeout(() => audioElem.pause(), 500)
  return audioElem.play()
}

// --- run startup

createGraffiti()
loadIndex()
