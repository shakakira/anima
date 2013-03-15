var timeline = anima.timeline()
timeline.add($('.viewport div')[0])

function $(selector, context) {
  return Array.prototype.slice.call(
    (context || document).querySelectorAll(selector)
  )
}

var State = {
  initial: {
    translate: [0,0,0],
    rotate: [0,0,0],
    scale:[1,1,1]
  },
  copy: function (state) {
    return {
      translate: state.translate.slice(),
      rotate: state.rotate.slice(),
      scale: state.scale.slice()
    }
  },
  diff: function (prev, next) {
    function differ(type) {
      return function (t, i) {
	return t - prev[type][i]
      }
    }
    return {
      translate: next.translate.map(differ('translate')),
      rotate: next.rotate.map(differ('rotate')),
      scale: next.scale.map(differ('scale'))
    }
  }
}

function Editor(timeline) {
  this.timeline = timeline
  this.init()
}

Editor.prototype.init = function () {
  this.current = 0
  this.keyframes = []

  var this_ = this

  this.timeline.on('update', function (time) {
    $('.panel_timeline input[type=range]')[0].value = time

    !['translate','rotate','scale'].forEach(function(t){
      [0,1,2].forEach(function(a) {
	$('.panel_right input[data-transform='+ t +'][data-axis="' + a + '"]')[0].value = this_.timeline.items[this_.current].state[t][a]
      })
    })
  }.bind(this))

  $('.panel_timeline input[type=range]')[0].addEventListener('change', function () {
    this_.timeline.seek(this.value)
  }, false)

  $('.panel_timeline input[type=button]')[0].addEventListener('click', function () {
    this_.keyframe(this_.timeline.currentTime)
  }, false)

  $('.panel_timeline .code')[0].addEventListener('click', function () {
    this_.stringify(this_.timeline.items[this_.current])
  }, false)

  $('.panel_right input[type=range]').forEach(function(range){
    range.addEventListener('change', function () {
      this_.timeline.items[this_.current].state[this.dataset['transform']][this.dataset['axis']] = this.value
    }, false)
  })
}

Editor.prototype.keyframe = function (time) {
  var index = this.current,
      keyframes = this.keyframes,
      item = this.timeline.items[this.current],
      state = State.copy(item.state)

  keyframes[index] || (keyframes[index] = [])
  keyframes[index].push({time: time, state: state})
  keyframes[index] = keyframes[index].sort(function(a, b) { return a.time - b.time })

  this.animate(item)
  item.state = State.copy(state)
}

Editor.prototype.animate = function (item) {
  item.stop()
  item.clear()

  var index = this.current,
      prevState = State.initial,
      prevTime = 0

  this.keyframes[index].forEach(function(frame) {
    item.animate(State.diff(prevState, frame.state), frame.time - prevTime)
    prevState = State.copy(frame.state)
    prevTime = frame.time
  })
}

Editor.prototype.stringify = function (item) {
  item.clear()
  this.popup(item.css(true).keyframes('animation'))
}

Editor.prototype.popup = function (string) {
  $('.popup')[0].textContent = string.replace(/([;{}])/g, '$1\n')
  $('.popup')[0].style.display = 'block'
}

new Editor(timeline)