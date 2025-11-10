// original lib (very outdated): https://github.com/deskjet/chiptune2.js
'use strict'

// player
var ChiptuneJsPlayer = function (config) {
  this.config = config
  this.context = config.context || new (window['AudioContext'] || window['webkitAudioContext'])()
  this.currentPlayingNode = null
}

ChiptuneJsPlayer.prototype.constructor = ChiptuneJsPlayer

ChiptuneJsPlayer.prototype.onProcess = () => {}
ChiptuneJsPlayer.prototype.onEnded = () => {}

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

ChiptuneJsPlayer.prototype.getCurrentSeconds = function() {
  return libopenmpt._openmpt_module_get_position_seconds(this.currentPlayingNode.modulePtr)
}

ChiptuneJsPlayer.prototype.setCurrentSeconds = function(t) {
  return libopenmpt._openmpt_module_set_position_seconds(this.currentPlayingNode.modulePtr, Math.max(t, 0))
}

ChiptuneJsPlayer.prototype.getTotalSeconds = function() {
  return this.currentPlayingNode.insn.end || libopenmpt._openmpt_module_get_duration_seconds(this.currentPlayingNode.modulePtr)
}

ChiptuneJsPlayer.prototype.getTotalOrder = function() {
  return libopenmpt._openmpt_module_get_num_orders(this.currentPlayingNode.modulePtr)
}

ChiptuneJsPlayer.prototype.getTotalPatterns = function() {
  return libopenmpt._openmpt_module_get_num_patterns(this.currentPlayingNode.modulePtr)
}

ChiptuneJsPlayer.prototype.setVolumeGainMillibells = function(volume) {
  return libopenmpt._openmpt_module_set_render_param(this.currentPlayingNode.modulePtr, 1, volume)
}

ChiptuneJsPlayer.prototype.metadata = function() {
  var data = {}
  var keys = ['title', 'message_raw', 'type']
  // sometimes some texts won't show up in `message`,
  // that's why need to use `message_raw` and add all other manually
  for (var i = 0; i < keys.length; i++) {
    let keyNameBuffer = libopenmpt._malloc(keys[i].length + 1)
    stringToUTF8(keys[i], keyNameBuffer, keys[i].length + 1)
    let textBuffer = libopenmpt._openmpt_module_get_metadata(this.currentPlayingNode.modulePtr, keyNameBuffer)
    data[keys[i]] = UTF8ToString(textBuffer)
    libopenmpt._free(textBuffer)
    libopenmpt._free(keyNameBuffer)
  }
  let nInstruments = libopenmpt._openmpt_module_get_num_instruments(this.currentPlayingNode.modulePtr)
  let instrumentText = ''
  for (var i = 0; i < nInstruments; i++) {
    let textBuffer = libopenmpt._openmpt_module_get_instrument_name(this.currentPlayingNode.modulePtr, i)
    instrumentText += UTF8ToString(textBuffer) + '\n'
    libopenmpt._free(textBuffer)
  }
  let nSamples = libopenmpt._openmpt_module_get_num_samples(this.currentPlayingNode.modulePtr)
  let sampleText = ''
  for (var i = 0; i < nSamples; i++) {
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

  //console.log(data.title + '\n---\n' + data.message_raw + '\n---\n' + data.message_instruments + '\n---\n' + data.message_samples)
  //console.log(data.title + '\n---\n' + data.message)
  return data
}

ChiptuneJsPlayer.prototype.play = function(buffer, insn = {}) {
  this.stop()
  this.currentPlayingNode = this.createLibopenmptNode(buffer, this.config, insn)
  libopenmpt._openmpt_module_set_repeat_count(this.currentPlayingNode.modulePtr, this.config.repeatCount || +insn['repeat'] || 0)
  this.setVolumeGainMillibells(this.config.volume)
  if (insn && insn.start) {
    console.debug('setting custom start time:', this.setCurrentSeconds(insn.start))
  }
  this.currentPlayingNode.reconnect()
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
  var maxFramesPerChunk = config.maxFramesPerChunk || config.bufferSize || 4096
  var processNode = this.context.createScriptProcessor(config.bufferSize || 2048, 0, 2)
  processNode.config = config
  processNode.insn = insn
  processNode.player = this
  var byteArray = new Int8Array(buffer)
  var ptrToFile = libopenmpt._malloc(byteArray.byteLength)
  processNode.ptrToFile = ptrToFile
  HEAPU8.set(byteArray, ptrToFile)
  processNode.modulePtr = libopenmpt._openmpt_module_create_from_memory(ptrToFile, byteArray.byteLength, 0, 0, 0)
  if (processNode.modulePtr == 0) {
    libopenmpt._free(this.ptrToFile)
    throw 'Bad file or unsupported file format'
  }
  processNode.paused = false
  processNode.leftBufferPtr  = libopenmpt._malloc(4 * maxFramesPerChunk)
  processNode.rightBufferPtr = libopenmpt._malloc(4 * maxFramesPerChunk)
  processNode.cleanup = function() {
    if (this.modulePtr != 0) {
      libopenmpt._openmpt_module_destroy(this.modulePtr)
      this.modulePtr = 0
    }
    if (this.ptrToFile != 0) {
      libopenmpt._free(this.ptrToFile)
      this.ptrToFile = 0
    }
    if (this.leftBufferPtr != 0) {
      libopenmpt._free(this.leftBufferPtr)
      this.leftBufferPtr = 0
    }
    if (this.rightBufferPtr != 0) {
      libopenmpt._free(this.rightBufferPtr)
      this.rightBufferPtr = 0
    }
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
    var outputL = e.outputBuffer.getChannelData(0)
    var outputR = e.outputBuffer.getChannelData(1)
    if (this.modulePtr == 0) {
      outputL.fill(0)
      outputR.fill(0)
      this.stop()
      return
    }
    if (this.paused) {
      outputL.fill(0)
      outputR.fill(0)
      return
    }
    var framesRendered = 0
    var ended = false
    var error = false
    var framesToRender = outputL.length
    let realSampleRate = this.context.sampleRate / (this.config.speed || 1)
    if (this.insn && this.insn.end && this.player.getCurrentSeconds() > this.insn.end) {
      ended = true
    } else
    while (framesToRender > 0) {
      var framesPerChunk = Math.min(framesToRender, maxFramesPerChunk)
      var actualFramesPerChunk = this.modulePtr && libopenmpt._openmpt_module_read_float_stereo(this.modulePtr, realSampleRate, framesPerChunk, this.leftBufferPtr, this.rightBufferPtr)
      if (actualFramesPerChunk == 0) {
        ended = true
        error = !this.modulePtr
      } else {
        var rawAudioLeft = HEAPF32.subarray(this.leftBufferPtr / 4, this.leftBufferPtr / 4 + actualFramesPerChunk)
        var rawAudioRight = HEAPF32.subarray(this.rightBufferPtr / 4, this.rightBufferPtr / 4 + actualFramesPerChunk)
        if (!config.smoothing) {
          outputL.set(rawAudioLeft, framesRendered)
          outputR.set(rawAudioRight, framesRendered)
        } else {
          // apply smoothing to remove noises
          let x = config.smoothingX || 0.99
          let smoothedValueL = processNode.smoothedValueL || 0
          let smoothedValueR = processNode.smoothedValueR || 0
          let smoothedVolume = processNode.smoothedVolume || 0
          for (var i = 0; i < actualFramesPerChunk; ++i) {
            let t = config.smoothing / (smoothedVolume + 1)
            let z = 1 - t
            let smoothedValueLNew = smoothedValueL * t + rawAudioLeft[i] * z
            let smoothedValueRNew = smoothedValueR * t + rawAudioRight[i] * z
            let currentVolume = (rawAudioLeft[i] - smoothedValueL) ** 2 + (rawAudioRight[i] - smoothedValueR) ** 2
            smoothedVolume = x * smoothedVolume + (1-x) * currentVolume
            outputL[framesRendered + i] = smoothedValueL = smoothedValueLNew
            outputR[framesRendered + i] = smoothedValueR = smoothedValueRNew
          }
          processNode.smoothedValueL = smoothedValueL
          processNode.smoothedValueR = smoothedValueR
          processNode.smoothedVolume = smoothedVolume
        }
        if (config.spectrumHook) {
          setTimeout(() => config.spectrumHook(rawAudioLeft, rawAudioRight, this.context.sampleRate), 0)
        }
      }
      if (actualFramesPerChunk < framesPerChunk) {
        outputL.fill(0, framesRendered + actualFramesPerChunk, framesRendered + framesPerChunk)
        outputR.fill(0, framesRendered + actualFramesPerChunk, framesRendered + framesPerChunk)
      }
      framesToRender -= framesPerChunk
      framesRendered += framesPerChunk
    }
    if (ended) {
      this.stop()
      processNode.player.onEnded()
    }
  }
  return processNode
}
