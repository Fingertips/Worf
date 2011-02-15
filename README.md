Worf
====

Help! The people who sold me this font only allowed me to host a Woff version
of the font and now it doesn't work in Safari!

    <script type="text/javascript" src="convert.min.js"></script>
    <script type="text/javascript">
      WORF.font_face('impact.woff', "\
        font-family: 'Impact';       \
        font-weight: normal;         \
        font-style: normal;          \
      ");
    </script>

Ok, now it does. You still need to specify which elements should use the font.

    em { font-family: Impact, sans-serif; }

The technical version
---------------------

Worf is a little bit of JavaScript that converts a Woff file to an inline
OpenType/TrueType @font-face declaration.

When you license a (web)font from a foundry you're not always allowed to host
an OpenType/TrueType version on your own server. However, you are often
allowed to host a Woff version of the file. Safari currently doesn't
understand Woff so you need the OpenType/TrueType version to make it work.

Because Worf converts the font inside the browser you're abiding by the terms
of the license.

Performance
-----------

For browsers that support Woff the penalty is obviously very low because
nothing needs to be done except detect that Woff is supported.

Safari needs to run the conversion of the font which takes a certain amount
of time. Usually less than 300 milliseconds per font and more often something
like 150 milliseconds.

Because the conversion is cached in local storage Safari only needs to do
it once.

Using multiple fonts
--------------------

You can supply a list of fonts to load, which is faster than using separate
statements:

    WORF.font_face(
      "impact.woff",
      "font-family: 'Impact'; font-weight: normal; font-style: normal;",
      "tahoma.woff",
      "font-family: 'Tahoma'; font-weight: bold; font-style: normal;"
    );