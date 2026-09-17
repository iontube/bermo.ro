// Impacheteaza fiecare <table> din markdown intr-un <div class="tabel"> derulabil orizontal.
// ⛔ De ce: ca sa poti derula un tabel lat pe mobil, varianta veche punea `display:block` chiar pe
// <table>. Un tabel devenit bloc se stramteaza la latimea continutului, deci `width:100%` nu mai
// are efect si tabelul nu mai umple containerul articolului. Solutia corecta e sa lasi tabelul
// `display:table` si sa pui `overflow-x:auto` pe un parinte.
export default function rehypeTabele() {
  return (tree) => {
    const mergi = (nod) => {
      if (!nod.children) return;
      for (let i = 0; i < nod.children.length; i++) {
        const c = nod.children[i];
        if (c.type === 'element' && c.tagName === 'table') {
          nod.children[i] = {
            type: 'element',
            tagName: 'div',
            properties: { className: ['tabel'] },
            children: [c],
          };
        } else {
          mergi(c);
        }
      }
    };
    mergi(tree);
  };
}
