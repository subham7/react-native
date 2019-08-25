import React, { Component } from "react"
import { View, PanResponder, Animated, Dimensions } from "react-native"

// Dynamic screen width
const SCREEN_WIDTH = Dimensions.get("window").width
const SWIPE_THRESHOLD = Dimensions.get("window").width * 0.25
const SWIPE_OUT_DURATION = 250

class Deck extends Component {
  static defaultProps = {
    onSwipeLeft: () => {},
    onSwipeRight: () => {}
  }

  constructor(props) {
    super(props)

    // Default position of the card
    const position = new Animated.ValueXY()
    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      // Mapping gesture to animate
      onPanResponderMove: (event, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy })
      },
      // When user release the card
      onPanResponderRelease: (event, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) this.forceSwipe("right")
        else if (gesture.dy < -SWIPE_THRESHOLD) this.forceSwipe("left")
        else this.resetPosition()
      }
    })
    this.state = { panResponder, position, index: 0 }
  }

  onSwipeComplete = direction => {
    const { onSwipeLeft, onSwipeRight, data } = this.props
    const { position, index } = this.state
    const item = data[index]

    direction === "right" ? onSwipeRight(item) : onSwipeLeft(item)
    position.setValue({ x: 0, y: 0 })
    this.setState({ index: index + 1 })
  }

  // Swipe card outside the screen wrt direction
  forceSwipe = direction => {
    const x = direction === "right" ? SCREEN_WIDTH : -SCREEN_WIDTH
    Animated.timing(this.state.position, {
      toValue: { x: x, y: 0 },
      duration: SWIPE_OUT_DURATION
    }).start(() => this.onSwipeComplete(direction))
  }

  // Reset to default position when user stops swiping
  resetPosition = () => {
    Animated.spring(this.state.position, {
      toValue: { x: 0, y: 0 }
    }).start()
  }

  // Style and animation is set here
  getCardStyle = () => {
    const { position } = this.state
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH * 2, 0, SCREEN_WIDTH * 2],
      outputRange: ["-120deg", "0deg", "120deg"]
    })

    return {
      ...position.getLayout(),
      transform: [{ rotate }]
    }
  }

  // Render card by mapping throungh the data.
  renderCards = () => {
    if (this.state.index >= this.props.data.length)
      return this.props.renderNoMoreCard()

    return this.props.data
      .map((item, i) => {
        if (i < this.state.index) return null
        if (i === this.state.index)
          return (
            <Animated.View
              key={item.id}
              style={[this.getCardStyle(), styles.cardStyle, { zIndex: 99 }]}
              {...this.state.panResponder.panHandlers}
            >
              {this.props.renderCard(item)}
            </Animated.View>
          )

        return (
          <Animated.View
            key={item.id}
            style={[
              styles.cardStyle,
              { top: 10 * (i - this.state.index), zIndex: 5 }
            ]}
          >
            {this.props.renderCard(item)}
          </Animated.View>
        )
      })
      .reverse()
  }

  render() {
    return <View>{this.renderCards()}</View>
  }
}

const styles = {
  cardStyle: { position: "absolute", width: SCREEN_WIDTH }
}

export default Deck
