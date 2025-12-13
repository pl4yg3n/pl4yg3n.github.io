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

ChiptuneJsPlayer.prototype.setCurrentSeconds = function(t) {
  let start = this.currentPlayingNode.insn.start || 0
  let out = libopenmpt._openmpt_module_set_position_seconds(this.currentPlayingNode.modulePtr, Math.max(t, 0) + start)
  this.onTick()
  console.debug(`Position set to ${out} seconds`)
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
  return libopenmpt._openmpt_module_set_render_param(this.currentPlayingNode.modulePtr, 1, volume)
}

ChiptuneJsPlayer.prototype.setRepeatCount = function(n) {
  return libopenmpt._openmpt_module_set_repeat_count(this.currentPlayingNode.modulePtr, n)
}

ChiptuneJsPlayer.prototype.getRepeatCount = function() {
  return libopenmpt._openmpt_module_get_repeat_count(this.currentPlayingNode.modulePtr)
}

ChiptuneJsPlayer.prototype.metadata = function() {
  let data = {}
  let keys = ['title', 'message_raw', 'type']
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

  //console.log(data.title + '\n---\n' + data.message_raw + '\n---\n' + data.message_instruments + '\n---\n' + data.message_samples)
  //console.log(data.title + '\n---\n' + data.message)
  return data
}

ChiptuneJsPlayer.prototype.play = function(buffer, insn = {}) {
  if (!insn) insn = {}
  this.stop()
  this.currentPlayingNode = this.createLibopenmptNode(buffer, this.config, insn)
  this.setRepeatCount(this.config.repeatCount || +insn['repeat'] || 0)
  this.setVolumeGainMillibells(this.config.volume)
  if (insn.t) this.setCurrentSeconds(insn.t)
  else if (insn.start) this.setCurrentSeconds(0)
  this.currentPlayingNode.reconnect()
}

ChiptuneJsPlayer.prototype.recreate = function() {
  let buffer = this.currentPlayingNode.buffer
  let insn = this.currentPlayingNode.insn
  insn.t = this.getCurrentSeconds()
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
  let maxFramesPerChunk = config.maxFramesPerChunk || config.bufferSize || 4096
  let processNode = this.context.createScriptProcessor(config.bufferSize || 2048, 0, 2)
  processNode.config = config
  processNode.insn = insn
  processNode.buffer = buffer
  processNode.player = this
  let byteArray = new Int8Array(buffer)
  let ptrToFile = libopenmpt._malloc(byteArray.byteLength)
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
    let outputL = e.outputBuffer.getChannelData(0)
    let outputR = e.outputBuffer.getChannelData(1)
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
    let framesRendered = 0
    let ended = false
    let framesToRender = outputL.length
    let realSampleRate = this.context.sampleRate / (this.config.speed || 1)
    if (this.insn.end && this.player.getCurrentSeconds() > this.insn.end) {
      ended = true
    } else
    while (framesToRender > 0) {
      let framesPerChunk = Math.min(framesToRender, maxFramesPerChunk)
      let actualFramesPerChunk = this.modulePtr && libopenmpt._openmpt_module_read_float_stereo(this.modulePtr, realSampleRate, framesPerChunk, this.leftBufferPtr, this.rightBufferPtr)
      if (actualFramesPerChunk == 0) {
        ended = true
      } else {
        let rawAudioLeft = HEAPF32.subarray(this.leftBufferPtr / 4, this.leftBufferPtr / 4 + actualFramesPerChunk)
        let rawAudioRight = HEAPF32.subarray(this.rightBufferPtr / 4, this.rightBufferPtr / 4 + actualFramesPerChunk)
        let lines = null
        let useGraph = config.useGraph && config.graphParams.canvas
        if (!config.smoothing) {
          // just copy raw data
          outputL.set(rawAudioLeft, framesRendered)
          outputR.set(rawAudioRight, framesRendered)
          // dump line data if needed
          if (useGraph) {
            lines = {
              l: {data: rawAudioLeft, color: '#05f'},
              r: {data: rawAudioRight, color: '#f50'},
            }
          }
        } else {
          // apply smoothing to remove sharp noises
          let sm = config.smoothing
          let smX = config.smoothingX || 0.9

          // setup value storage
          if (!processNode.vals) {
            processNode.vals = {
              prevOutL: 0,
              prevOutR: 0,
              prevL0: 0,
              prevR0: 0,
              volAvg1L: 0,
              volAvg1R: 0,
              volAvg2L: 0,
              volAvg2R: 0,
            }
          }
          let v = processNode.vals
          // setup line data dumping if needed
          if (useGraph) {
            lines = {
              vol: {data: [], color: '#f00', oh: 1},
              mav: {data: [], color: '#a00', oh: 1},
              vsm: {data: [], color: '#0f0', oh: 1},
              smu: {data: [], color: '#f0f', oh: 1},
              raw: {data: [], color: '#fa0'},
              out: {data: [], color: '#0af'},
            }
          }
          for (let i = 0; i < actualFramesPerChunk; ++i) {
            // algorithm: for each channel
            // volume = abs(raw[i] - raw[i-1])
            // compute double exponential-window average of volume
            // then dampen value to last output depending on that average volume
            let currL0 = rawAudioLeft[i]
            let currR0 = rawAudioRight[i]
            let volL = Math.abs(currL0 - v.prevL0)
            let volR = Math.abs(currR0 - v.prevR0)
            v.volAvg1L = v.volAvg1L * smX + volL * (1 - smX)
            v.volAvg1R = v.volAvg1R * smX + volR * (1 - smX)
            v.volAvg2L = v.volAvg2L * smX + v.volAvg1L * (1 - smX)
            v.volAvg2R = v.volAvg2R * smX + v.volAvg1R * (1 - smX)
            let s0L = (1 / (1 + v.volAvg2L*sm)**2)
            let s0R = (1 / (1 + v.volAvg2R*sm)**2)
            outputL[framesRendered + i] = v.prevOutL = (rawAudioLeft[i] * s0L) + v.prevOutL * (1 - s0L)
            outputR[framesRendered + i] = v.prevOutR = (rawAudioRight[i] * s0R) + v.prevOutR * (1 - s0R)
            v.prevL0 = currL0
            v.prevR0 = currR0
            // dump line data if needed
            if (lines) {
              lines.raw.data.push(rawAudioLeft[i])
              lines.out.data.push(v.prevOutL)
              lines.mav.data.push(v.volAvg1L)
              lines.vol.data.push(volL)
              lines.vsm.data.push(v.volAvg2L)
              lines.smu.data.push(s0L)
            }
          }
        }
        // output line data to oscilloscope
        if (lines && useGraph) {
          let canv = config.graphParams.canvas
          let w = config.graphParams.w
          let h = config.graphParams.h
          let scaleW = w / maxFramesPerChunk
          if (canv.width != w) canv.width = w
          if (canv.height != h) canv.height = h
          let c = canv.getContext('2d')
          c.clearRect(0, 0, w, h)
          c.globalCompositeOperation = 'screen'
          c.lineWidth = config.graphParams.lineWidth
          for (let l of Object.values(lines)) {
            c.beginPath()
            let scaleH = (l.oh || 0.5) * h
            for (let i = 0; i < l.data.length; ++i) {
              c.lineTo((i + 0.5) * scaleW, (1 - l.data[i]) * scaleH)
            }
            c.strokeStyle = l.color
            c.stroke()
          }
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
      let repeatCount = this.player.getRepeatCount()
      if (repeatCount == -1) {
        // force repeat if repeating endlessly
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
