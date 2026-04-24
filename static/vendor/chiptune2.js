// original lib (very outdated): https://github.com/deskjet/chiptune2.js
'use strict'

// player
const ChiptuneJsPlayer = function (config) {
  this.config = config
  this.context = config.context || new (window['AudioContext'] || window['webkitAudioContext'])()
  this.currentPlayingNode = null
}

ChiptuneJsPlayer.prototype.constructor = ChiptuneJsPlayer

ChiptuneJsPlayer.prototype.onTick = () => {}
ChiptuneJsPlayer.prototype.onEnded = () => {}
ChiptuneJsPlayer.prototype.onProcess = () => {}

// metadata
ChiptuneJsPlayer.prototype.getCurrentRow = function() {
  return libopenmpt._openmpt_module_get_current_row(this.currentPlayingNode.modulePtr)
}

ChiptuneJsPlayer.prototype.getCurrentPattern = function() {
  return libopenmpt._openmpt_module_get_current_pattern(this.currentPlayingNode.modulePtr)
}

ChiptuneJsPlayer.prototype.getCurrentOrder = function() {
  return libopenmpt._openmpt_module_get_current_order(this.currentPlayingNode.modulePtr)
}

ChiptuneJsPlayer.prototype.getCurrentTicksPerRow = function() {
  return libopenmpt._openmpt_module_get_current_speed(this.currentPlayingNode.modulePtr)
    * (this.config.tickFactor || 1) / (this.config.speed || 1)
}

ChiptuneJsPlayer.prototype.getCurrentSeconds = function() {
  let start = this.currentPlayingNode.insn.start || 0
  return libopenmpt._openmpt_module_get_position_seconds(this.currentPlayingNode.modulePtr) - start
}

ChiptuneJsPlayer.prototype.getCurrentSecondsRaw = function() {
  return libopenmpt._openmpt_module_get_position_seconds(this.currentPlayingNode.modulePtr)
}

ChiptuneJsPlayer.prototype.setCurrentSeconds = function(t) {
  let start = this.currentPlayingNode.insn.start || 0
  let out = libopenmpt._openmpt_module_set_position_seconds(this.currentPlayingNode.modulePtr, Math.max(t, 0) + start)
  this.onTick()
  console.debug(`Position set to ${out.toFixed(2)} seconds`)
  return out
}

ChiptuneJsPlayer.prototype.getTotalSeconds = function() {
  let start = this.currentPlayingNode.insn.start || 0
  return (this.currentPlayingNode.insn.end || libopenmpt._openmpt_module_get_duration_seconds(this.currentPlayingNode.modulePtr)) - start
}

ChiptuneJsPlayer.prototype.getTotalOrder = function() {
  return libopenmpt._openmpt_module_get_num_orders(this.currentPlayingNode.modulePtr)
}

ChiptuneJsPlayer.prototype.getTotalPatterns = function() {
  return libopenmpt._openmpt_module_get_num_patterns(this.currentPlayingNode.modulePtr)
}

ChiptuneJsPlayer.prototype.setVolumeGainMillibells = function(volume) {
  if (this.currentPlayingNode.insn && this.currentPlayingNode.insn.gainMillibells) {
    volume += this.currentPlayingNode.insn.gainMillibells
    console.debug('Using amplified volume:', volume)
  }
  return libopenmpt._openmpt_module_set_render_param(this.currentPlayingNode.modulePtr, 1, volume)
}

ChiptuneJsPlayer.prototype.setRepeatCount = function(n) {
  return libopenmpt._openmpt_module_set_repeat_count(this.currentPlayingNode.modulePtr, n)
}

ChiptuneJsPlayer.prototype.getRepeatCount = function() {
  return libopenmpt._openmpt_module_get_repeat_count(this.currentPlayingNode.modulePtr)
}

ChiptuneJsPlayer.prototype.metadata = function(additionalKeys) {
  let data = {}
  let keys = ['title', 'message_raw', 'type']
  if (additionalKeys && additionalKeys.length) keys = keys.concat(additionalKeys)
  // sometimes some texts won't show up in `message`,
  // that's why need to use `message_raw` and add all other manually
  for (let i = 0; i < keys.length; i++) {
    let keyNameBuffer = libopenmpt._malloc(keys[i].length + 1)
    stringToUTF8(keys[i], keyNameBuffer, keys[i].length + 1)
    let textBuffer = libopenmpt._openmpt_module_get_metadata(this.currentPlayingNode.modulePtr, keyNameBuffer)
    data[keys[i]] = UTF8ToString(textBuffer)
    libopenmpt._free(textBuffer)
    libopenmpt._free(keyNameBuffer)
  }
  let nInstruments = libopenmpt._openmpt_module_get_num_instruments(this.currentPlayingNode.modulePtr)
  let instrumentText = ''
  for (let i = 0; i < nInstruments; i++) {
    let textBuffer = libopenmpt._openmpt_module_get_instrument_name(this.currentPlayingNode.modulePtr, i)
    instrumentText += UTF8ToString(textBuffer) + '\n'
    libopenmpt._free(textBuffer)
  }
  let nSamples = libopenmpt._openmpt_module_get_num_samples(this.currentPlayingNode.modulePtr)
  let sampleText = ''
  for (let i = 0; i < nSamples; i++) {
    let textBuffer = libopenmpt._openmpt_module_get_sample_name(this.currentPlayingNode.modulePtr, i)
    let sampleName = UTF8ToString(textBuffer)
    if (sampleName == 'untitled' || sampleName == 'Untitled') sampleName = ''
    sampleText += sampleName + '\n'
    libopenmpt._free(textBuffer)
  }
  data.message_instruments = instrumentText
  data.message_samples = sampleText

  data.title = data.title.trim()

  // try to deduplicate texts
  if (sampleText.includes(instrumentText)) instrumentText = ''
  else if (instrumentText.includes(sampleText)) sampleText = ''

  data.message = data.message_raw + '\n\n' + (data.type == 'it' ?
    sampleText + '\n\n' + instrumentText :
    instrumentText + '\n\n' + sampleText)
  // remove all blank lines in front, leave no more than 1 blank line in row, remove whitespace at end
  data.message = data.message.replaceAll(/^( *\n)+/g, '').replaceAll(/( *\n){3,}/g, '\n\n').trimEnd()

  data.header = data.title
  if (!data.header) {
    let m = data.message.match(/^.*?[a-z0-9].*$/mi) || data.message.match(/^.*$/m)
    data.header = m[0].trim()
  }

  return data
}

ChiptuneJsPlayer.prototype.play = function(buffer, insn = {}) {
  insn = Object.assign({}, insn)
  this.stop()
  this.currentPlayingNode = this.createLibopenmptNode(buffer, this.config, insn)
  this.setRepeatCount(this.config.repeatCount || +insn['repeat'] || 0)
  this.setVolumeGainMillibells(this.config.volume)
  if (insn.t) {
    this.setCurrentSeconds(insn.t)
  } else if (insn.start) this.setCurrentSeconds(0)
  if (!this.currentPlayingNode.paused) this.currentPlayingNode.reconnect()
}

ChiptuneJsPlayer.prototype.recreate = function() {
  let buffer = this.currentPlayingNode.buffer
  let insn = this.currentPlayingNode.insn
  insn.t = this.getCurrentSeconds()
  insn.paused = this.currentPlayingNode.paused
  this.play(buffer, insn)
}

ChiptuneJsPlayer.prototype.stop = function() {
  if (this.currentPlayingNode != null) {
    this.currentPlayingNode.disconnect()
    this.currentPlayingNode.cleanup()
    this.currentPlayingNode = null
  }
}

ChiptuneJsPlayer.prototype.togglePause = function() {
	if (this.currentPlayingNode != null) {
    this.currentPlayingNode.togglePause()
  }
}

ChiptuneJsPlayer.prototype.createLibopenmptNode = function(buffer, config, insn) {
  let bufferSize = config.bufferSize || 2048
  let processNode = this.context.createScriptProcessor(bufferSize, 0, 2)
  processNode.config = config
  processNode.insn = insn
  processNode.buffer = buffer
  processNode.player = this
  processNode.paused = !!insn.paused
  let byteArray = new Uint8Array(buffer)
  let ptrToFile = libopenmpt._malloc(byteArray.byteLength)
  processNode.ptrToFile = ptrToFile
  HEAPU8.set(byteArray, ptrToFile)
  processNode.modulePtr = libopenmpt._openmpt_module_create_from_memory(ptrToFile, byteArray.byteLength, 0, 0, 0)
  if (processNode.modulePtr == 0) {
    libopenmpt._free(this.ptrToFile)
    throw 'Bad file or unsupported file format'
  }

  processNode.lBufferPtr = libopenmpt._malloc(bufferSize << 2)
  processNode.rBufferPtr = libopenmpt._malloc(bufferSize << 2)
  processNode.cleanup = function() {
    if (this.modulePtr != 0) {
      libopenmpt._openmpt_module_destroy(this.modulePtr)
      this.modulePtr = 0
    }
    if (this.ptrToFile != 0) {
      libopenmpt._free(this.ptrToFile)
      this.ptrToFile = 0
    }
    if (this.lBufferPtr != 0) {
      libopenmpt._free(this.lBufferPtr)
      this.lBufferPtr = 0
    }
    if (this.rBufferPtr != 0) {
      libopenmpt._free(this.rBufferPtr)
      this.rBufferPtr = 0
    }
    this.onaudioprocess = null
  }
  processNode.stop = function() {
    this.disconnect()
    this.cleanup()
  }
  processNode.reconnect = function() {
    this.connect(this.player.context.destination)
  }
  processNode.pause = function() {
    this.paused = true
    this.disconnect()
  }
  processNode.unpause = function() {
    this.paused = false
    this.reconnect()
  }
  processNode.togglePause = function() {
    if (this.paused) {
      this.unpause()
    } else {
      this.pause()
    }
  }

  processNode.onaudioprocess = function(e) {
    let outputL = e.outputBuffer.getChannelData(0)
    let outputR = e.outputBuffer.getChannelData(1)
    if (!this.modulePtr || this.paused) {
      outputL.fill(0)
      outputR.fill(0)
      if (!this.modulePtr) this.stop()
      return
    }
    let ended = !this.modulePtr || (this.insn.end && this.player.getCurrentSecondsRaw() > this.insn.end)
    if (!ended) {
      let distortedSampleRate = this.context.sampleRate / (this.config.speed || 1)
      let framesRendered = this.modulePtr && libopenmpt._openmpt_module_read_float_stereo(
        this.modulePtr, distortedSampleRate, bufferSize, this.lBufferPtr, this.rBufferPtr
      )
      if (framesRendered) {
        outputL.set(HEAPF32.subarray(this.lBufferPtr >> 2, (this.lBufferPtr >> 2) + framesRendered))
        outputR.set(HEAPF32.subarray(this.rBufferPtr >> 2, (this.rBufferPtr >> 2) + framesRendered))
        processNode.player.onProcess(outputL, outputR, framesRendered, this.context.sampleRate)
      } else {
        ended = true
      }
      if (framesRendered < bufferSize) {
        outputL.fill(0, framesRendered, bufferSize)
        outputR.fill(0, framesRendered, bufferSize)
      }
    }
    if (ended) {
      let repeatCount = this.player.getRepeatCount()
      if (repeatCount) {
        if (repeatCount > 0) this.player.setRepeatCount(repeatCount - 1)
        this.player.setCurrentSeconds(0)
      } else {
        this.stop()
        processNode.player.onEnded()
      }
    } else {
      processNode.player.onTick()
    }
  }
  return processNode
}
