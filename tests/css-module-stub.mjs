// Stand-in for a compiled `*.module.css` import.
//
// css-loader hands components an object mapping the authored class name to a
// hashed one. Tests only ever read those keys, so echoing the key back keeps
// `styles.toolbar` truthy and readable in assertion output without needing a
// real CSS pipeline.
const styles = new Proxy(
  {},
  {
    get(_target, property) {
      if (typeof property !== 'string') {
        return undefined;
      }
      if (property === 'default' || property === '__esModule') {
        return undefined;
      }
      return property;
    },
  },
);

export default styles;
