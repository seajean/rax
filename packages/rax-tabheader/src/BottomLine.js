import {createElement, findDOMNode, Component} from 'rax';
import View from 'rax-view';
import Text from 'rax-text';
import ScrollView from 'rax-scrollview';
import Animated from './animation';
import styles from './styles';

class BottomLine extends Component {

  constructor(props) {
    super(props);
  }

  scrollTo = (options) => {
    const bottomLine = findDOMNode(this.refs.bottomLine);
    Animated.scrollTo(bottomLine, options, () => {
      this.oldPlaceX = parseInt(options.x);
    });
  }

  componentDidMount() {
    const left = parseInt(this.props.itemWidth.split('rem')[0]) * this.props.selected;
    this.scrollTo({x: left});
  }

  render() {
    let itemWidth = this.props.itemWidth || '166rem';
    let backgroundColor = '#fc511f';
    if (this.props.style) {
      backgroundColor = this.props.style.borderColor || this.props.style.borderBottomColor || this.props.style.backgroundColor;
    }
    let top = 76;
    if (this.props.styleType == 'icon') {
      top = 108;
    }

    return <View style={styles.borderBottom}>
      <View
        ref="bottomLine"
        style={{
          position: 'absolute',
          left: 0,
          top: top,
          height: 4,
          width: itemWidth,
          backgroundColor: backgroundColor,
          ...this.props.style
        }}
      />
    </View>;
  }
}


export default BottomLine;
