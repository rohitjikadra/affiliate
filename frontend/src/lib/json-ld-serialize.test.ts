import assert from "node:assert/strict";
import { test } from "node:test";
import { serializeJsonLd } from "./json-ld-serialize.ts";

test("escapes </script> in titles so JSON-LD cannot break out of the script tag", () => {
  const html = serializeJsonLd({
    "@type": "Product",
    name: 'Mixer</script><script>alert("xss")</script>',
  });

  assert.equal(html.includes("</script>"), false);
  assert.equal(html.includes("<script>"), false);
  assert.match(html, /\\u003c/);

  const parsed = JSON.parse(html) as { name: string };
  assert.equal(parsed.name, 'Mixer</script><script>alert("xss")</script>');
});

test("escapes </script> in FAQ answers", () => {
  const html = serializeJsonLd({
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is it loud?",
        acceptedAnswer: {
          "@type": "Answer",
          text: 'No.</script><img src=x onerror=alert(1)>',
        },
      },
    ],
  });

  assert.equal(html.includes("</script>"), false);
  const parsed = JSON.parse(html) as {
    mainEntity: Array<{ acceptedAnswer: { text: string } }>;
  };
  assert.equal(parsed.mainEntity[0]?.acceptedAnswer.text.includes("</script>"), true);
});
