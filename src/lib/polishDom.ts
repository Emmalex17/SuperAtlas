/** Replaces literal "—"/"-" placeholder text with words, porting the prototype's own
 * post-render pass (c7.js `polishDom`, wrapped around every `render()`, dialog and drawer
 * open): numeric contexts read "None yet", everything else reads "None", and the parent
 * gets a `.na` class for the muted styling that goes with it. */
export function polishDom(root: Element | null) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const hits: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const t = node as Text;
    const v = t.nodeValue?.trim();
    if (v === "—" || v === "-") hits.push(t);
  }
  hits.forEach((t) => {
    const p = t.parentElement;
    if (!p || p.closest("svg,code,kbd")) return;
    const big = p.closest(".kt-v,.kpi-n,.num,.sc-kpis b,.mio-k b");
    t.nodeValue = big ? "None yet" : "None";
    p.classList.add("na");
  });
}
