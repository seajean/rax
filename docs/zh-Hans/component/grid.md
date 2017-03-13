# Grid 栅格布局

面向移动端页面的简单布局标签，提供外部布局容器标签 Grid，内容标签 Col，以及多行多列布局 MultiRow。

### 引用

```jsx
import { Row, Col } from 'rax-grid';
```

### 默认等宽度布局

等宽布局支持任意多列

等宽3列布局：

![](https://img.alicdn.com/tps/TB17t9SKVXXXXXnapXXXXXXXXXX-415-116.png)

```jsx
<Row>
  <Col>列1</Col>
  <Col>列2</Col>
  <Col>列3</Col>
</Row>
```

等宽两列布局：

![](https://img.alicdn.com/tps/TB1Dk9OKVXXXXciapXXXXXXXXXX-415-115.png)

```jsx
<Row>
  <Col>列1</Col>
  <Col>列2</Col>
</Row>
```

### 自定义列宽度

下面示例中第一列占整个容器的 1/3，第二列占整个容器的 2/3

![](https://img.alicdn.com/tps/TB1LL5TKVXXXXcHaXXXXXXXXXXX-415-113.png)

```jsx
const styles = {
  col1: {
    flex: 1
  },
  col2: {
    flex: 2
  },
}
<Row>
  <Col style={styles.col1}>flex: 1</Col>
  <Col style={styles.col2}>flex: 2</Col>
</Row>
```
