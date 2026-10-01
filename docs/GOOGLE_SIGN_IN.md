# Turning on "Sign in with Google"

When this is set up, anyone using the app can sign in with their Google account, and their progress is saved to it:

- **Any device:** progress follows them to every phone or computer they sign in on, and syncs live between them.
- **Safe:** nothing is lost if they clear their browser or lose their phone.
- **Offline:** the app still works offline. Changes sync when it's back online.
- **Optional:** people who don't sign in keep progress on their device, as before.

It uses **Firebase** (Google's app backend) on the free **Spark** plan, so **there's no cost and no credit card**. The free limits are 50,000 reads and 20,000 writes a day and 1 GB of storage. Each person uses a few dozen writes a day, so even a whole class stays far below that. The paid **Blaze** plan includes the same free amount each day and only charges above it, so this app costs nothing on Blaze too.

Setup takes about 10 minutes, all in the browser. Do it while signed in to the Google account you want to own the project.

## 1. Create the project

1. Go to <https://console.firebase.google.com> and click **Create a project** (or **Add project**).
2. Name it, for example `chem-companion`. You can turn off Google Analytics; it isn't needed.
3. Click **Create project**, then **Continue**.

## 2. Turn on Google sign-in

1. In the left menu, open **Security → Authentication** and click **Get started**. (Older layouts call this **Build → Authentication**. You can also type "Authentication" in the search box at the top.)
2. On the **Sign-in method** tab, choose **Google**, switch it **on**, pick your email as the *support email*, and click **Save**.
3. Open the **Settings** tab → **Authorized domains** → **Add domain**, and add the site's address *without* `https://` or a path, for example `your-github-username.github.io`. (`localhost` is already there for testing.)

## 3. Create the database

1. In the left menu, open **Databases & Storage → Firestore** (older layouts: **Build → Firestore Database**) and click **Create database**.
2. Leave the database ID as `(default)`. If you give it a name, add `databaseId: '<that name>'` to the config in step 4. If asked for an edition, choose **Standard**. Pick a location near you (for example `nam5 (United States)`). It can't be changed later.
3. Choose **Start in production mode** and click **Create**.
4. Open the **Rules** tab and replace everything with the contents of [`firestore.rules`](../firestore.rules) from this project. Click **Publish**.

The rules make sure **each person can only ever read or write their own progress**. Nobody can read anyone else's, including people who poke around with developer tools.

## 4. Connect the app

1. Click the **gear ⚙ → Project settings**. Under **Your apps**, click the **web icon `</>`**.
2. Give it a nickname (for example `Chem Companion web`). **Don't** tick Firebase Hosting, because GitHub Pages already hosts the site. Click **Register app**.
3. Firebase shows a `firebaseConfig = { … }` block. Copy the part in braces into [`js/cloud/config.js`](../js/cloud/config.js), so it reads:

   ```js
   export const FIREBASE_CONFIG = {
     apiKey: '…',
     authDomain: 'chem-companion-xxxx.firebaseapp.com',
     projectId: 'chem-companion-xxxx',
     storageBucket: '…',
     messagingSenderId: '…',
     appId: '…',
   };
   ```

   These values are **meant to be public**, because they only say which Firebase project to use, so it's fine to commit them. What protects people's data is the rules from step 3.
4. Commit and push. A minute later, the site has **Settings → Account → Sign in with Google**, a sign-in option in the welcome screens, and a reminder on the home screen for people who haven't signed in.

## Try it

- Open the site, go to **Settings**, and sign in. You should see "Saved to your account · just now".
- Open the site on a second device (or another browser) and sign in with the same Google account. Answer a question on one, and the other updates within a few seconds.

You can also try the screens on your computer *before* setting up Firebase. Run `ruby tools/serve.rb`, open <http://localhost:8080>, and enter this in the browser console:

```js
localStorage.setItem('cc-fake-cloud', '1')
```

Then reload. Sign-in now uses a pretend account stored in the browser. Remove that setting to go back.

## If it doesn't work

The message under **Settings → Account** says what's wrong:

- **"The cloud database isn't set up yet"**: Firebase has no Firestore database named `(default)`.
  - Open **Databases & Storage → Firestore** and click **Create database**. (*Data Connect*, *Realtime Database* and *Storage* are different products. The app doesn't use them.)
  - Leave the **Database ID** as `(default)` and choose the **Standard** edition. If the database already has another name (shown at the top of the Firestore page), put that name in `js/cloud/config.js` as `databaseId: '…'` instead. Its rules are set separately, on its own **Rules** tab.
  - To see which Firestore databases exist, go to <https://console.cloud.google.com/firestore/databases> and pick the project.
  - Sign-in still works meanwhile, and progress stays on the device. It syncs by itself once the database exists (within about 5 minutes, or straight away after a reload).
- **"Google sign-in isn't set up for this web address yet"**: add the site's domain under **Authentication → Settings → Authorized domains** (step 2).
- **"The cloud database refused to save"**: publish the rules from step 3.
- **No sign-in button at all**: `js/cloud/config.js` is still `null`, or the new version hasn't been pushed yet.

## Reading "This confused me" reports

Every question, lesson page, flashcard and reaction has a **This confused me** button. A report says what was confusing (four choices plus an optional note), where it happened, and for questions, the question, her answer and the correct answer. For auto-generated questions, it also includes the generator and seed, so the exact question can be rebuilt (`tests/questions.html?gen=<generator>&seed=<seed>`).

- **Where to read them:** Firebase → **Firestore** → your database → the **feedback** collection. Each report is one document. `who` is the name she gave the app, and `uid` matches **Authentication → Users**.
- **Signed out or offline:** the report is kept on the device and sent automatically after she signs in.
- **Who can read them:** only you, in the console. The app can't read, change or delete reports, not even the person who sent them.
- **Rules:** reports need the `feedback` part of [`firestore.rules`](../firestore.rules). If you published the rules before October 2026, paste them in and **Publish** again.

## Good to know

- **What's saved:** one document per person in the database (`users/<their account id>`), containing only their study progress. The app never reads their email, contacts or anything else from Google. It only shows their name, email and picture in Settings so they know which account they're using.
- **What you can see:** as the project owner, the Firebase console shows the list of people who signed in (**Authentication → Users**, with their emails) and the raw progress data. If classmates use the app, it's fair to tell them that.
- **Deleting data:** in **Settings → Account**, anyone can delete their own cloud copy. To remove someone's sign-in record completely, delete them under **Authentication → Users**.
- **Merging:** if someone used the app before signing in, their existing progress is combined with their account the first time they sign in. A different person signing in on the same device never gets the first person's progress.
- **Reset:** **Settings → Reset all progress** while signed in resets that account on every device.
- **iPhone home-screen app:** Google sign-in opens in a small Safari window and returns to the app. If an installed app ever won't sign in, signing in once from Safari itself works too. (The iPhone home-screen app and Safari keep separate copies, but once both are signed in, they share progress through the account.)
- **Firebase library version:** it's set in [`js/cloud/firebase.js`](../js/cloud/firebase.js) (`VERSION`). It's loaded from Google's CDN only when sign-in is turned on.
