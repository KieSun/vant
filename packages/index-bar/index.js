import { use } from '../utils';
import { TouchMixin } from '../mixins/touch';
import { ParentMixin } from '../mixins/relation';
import { on, off } from '../utils/event';
import { getScrollTop, getElementTop, getScrollEventTarget } from '../utils/scroll';

const [sfc, bem] = use('index-bar');

export default sfc({
  mixins: [TouchMixin, ParentMixin('vanIndexBar')],

  props: {
    sticky: {
      type: Boolean,
      default: true
    },
    zIndex: {
      type: Number,
      default: 1
    },
    indexList: {
      type: Array,
      default() {
        const indexList = [];
        const charCodeOfA = 'A'.charCodeAt(0);

        for (let i = 0; i < 26; i++) {
          indexList.push(String.fromCharCode(charCodeOfA + i));
        }

        return indexList;
      }
    }
  },

  mounted() {
    this.scroller = getScrollEventTarget(this.$el);
    this.handler(true);
  },

  destroyed() {
    this.handler(false);
  },

  activated() {
    this.handler(true);
  },

  deactivated() {
    this.handler(false);
  },

  methods: {
    handler(bind) {
      /* istanbul ignore else */
      if (this.binded !== bind) {
        this.binded = bind;
        (bind ? on : off)(this.scroller, 'scroll', this.onScroll);
      }
    },

    onScroll() {
      if (!this.sticky) {
        return;
      }

      const scrollTop = getScrollTop(this.scroller);
      const rects = this.children.map(item => ({
        height: item.height,
        top: getElementTop(item.$el)
      }));

      const active = this.getActiveAnchorIndex(scrollTop, rects);

      this.children.forEach((item, index) => {
        if (index === active) {
          item.active = true;
          item.top = Math.max(0, rects[index].top - scrollTop);
        } else if (index === active - 1) {
          const nextItemTop = rects[index + 1].top - scrollTop;
          item.active = nextItemTop > 0;
          item.top = nextItemTop - rects[index + 1].height;
        } else {
          item.active = false;
        }
      });
    },

    getActiveAnchorIndex(scrollTop, rects) {
      for (let i = this.children.length - 1; i >= 0; i--) {
        const prevHeight = i > 0 ? rects[i - 1].height : 0;

        if (scrollTop + prevHeight >= rects[i].top) {
          return i;
        }
      }
      return -1;
    },

    onClick(event) {
      this.scrollToElement(event.target);
    },

    onTouchMove(event) {
      this.touchMove(event);

      if (this.direction === 'vertical') {
        /* istanbul ignore else */
        if (event.cancelable) {
          event.preventDefault();
        }

        const { clientX, clientY } = event.touches[0];
        const target = document.elementFromPoint(clientX, clientY);
        this.scrollToElement(target);
      }
    },

    scrollToElement(element, setActive) {
      if (!element) {
        return;
      }

      const { index } = element.dataset;
      if (!index) {
        return;
      }

      const match = this.children.filter(item => String(item.index) === index);
      if (match[0]) {
        match[0].scrollIntoView();
        this.$emit('select', match[0].index);
      }
    },

    onTouchEnd() {
      this.active = null;
    }
  },

  render(h) {
    return (
      <div class={bem()}>
        <div
          class={bem('sidebar')}
          style={{ zIndex: this.zIndex }}
          onClick={this.onClick}
          onTouchstart={this.touchStart}
          onTouchmove={this.onTouchMove}
          onTouchend={this.onTouchEnd}
          onTouchcancel={this.onTouchEnd}
        >
          {this.indexList.map(index => (
            <span class={bem('index')} data-index={index}>
              {index}
            </span>
          ))}
        </div>
        {this.slots('default')}
      </div>
    );
  }
});
