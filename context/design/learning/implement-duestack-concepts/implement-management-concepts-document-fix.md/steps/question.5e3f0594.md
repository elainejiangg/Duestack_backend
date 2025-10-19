---
timestamp: 'Sun Oct 19 2025 01:49:47 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_014947.ae05e25e.md]]'
content_id: 5e3f05943ccf7e1c9a44d5b89649172142ee646f18823620925e08396bd88c35
---

# question: After reading

## Use of Files with Mongo and in Concepts

Updated 1 week ago by Sinjin Cho-Tupua

**Endorsed by Instructor (Eagon Meng)**

Hi. For one of my concepts, it involves having files, typically pdfs, in the state. How would this work with Mongo and with our concepts? Would the files be stored to Mongo in a certain way?

assignmentsassignments ∕ a4

Edit

**2**

**34 views**

***

Students' Answer

Where students collectively construct a single answer

***

Instructors' Answer

Updated 1 week ago by Eagon Meng

Good question, I imagine a number of people would want to do something similar (e.g. store media files, large images, etc.) In general, MongoDB is meant for informational state, meaning that you expect to reason over it and store information about your application. Media, such as PDF files or other resources that you don't intend on introspecting a lot (meaning that metadata about the files themselves should be stored in some concept normally), is generally **not** advised to store in a database. 

So how would you do this? The essence of a file upload is a side effect that transfers data from a client somewhere to a server somewhere. This is thus a client side action, usually using an upload `<input type="file">` html tag, that then upload the local file to a server.

Your concept should probably not need to manage something complicated like exposing an endpoint to receive file uploads. Instead, simply consider files to be stored in your object storage of choice: Google Storage, AWS S3, etc. This is a pretty standard industry practice, and there are a number of ways to make client upload not painful, such as pre-signed URLs. Here are some details:

<https://cloud.google.com/storage/docs/samples/storage-generate-upload-signed-url-v4#storage_generate_upload_signed_url_v4-nodejs>

Pre-signed URLs are urls that you can give to clients as a special way to make a PUT request for uploading a file to a location (with the request pre-signed, so all they need is the URL). This means that when you might have an action like "createDocument" or "uploadDocument", what your concept returns instead is a "Url" string. Your client (you'll make frontend in the next assignments, but for now you can simply use a local `curl` client or other if you want to test it) then takes that URL and uploads whatever file it wants. Your concept can read the file from the bucket/cloud storage, and do whatever processing it needs, but this is all done internally. At the action interface, your parameters must remain strings/primitive types, so you're free to do processing within actions.

**In summary:**

* Media files: images, PDFs, videos, etc. are not stored in MongoDB
* Media files are stored instead in a storage service, we recommend (since you already have a Google console project) [Google Cloud Storage](https://cloud.google.com/storage/docs/discover-object-storage-console)
* To upload files to your concept, you should have some concept action that returns a [Pre-signed url](https://cloud.google.com/storage/docs/samples/storage-generate-upload-signed-url-v4#storage_generate_upload_signed_url_v4-nodejs)
* You can do the bucket connection/any other initialization within the concept that handles that state as part of its initialization (code running before the concept definition)
* Once you call that action, any clients (in the future your front end, for now you can use your terminal and something like  `curl` ) can upload the file
* Afterwards, you can process those uploaded files as normal within the concept by downloading from the files stable Url. You'll probably want to include `a contentUrl string` state somewhere within your concept state to associate it with the right state (like Document, etc.)

**0**

***

2 Followup Discussions

***

Unresolved

@154\_f1

**Sinjin Cho-Tupua**  6 days ago

Thanks!

I'm still a bit confused on this though. I would like to implement and make tests for this concept, but I don't think I understand how it works.

What I understand it as is that maybe the state is a set of pre-signed URLs. When a user wants to upload a new file, they initiate some action such that the concept would return a new pre-signed URL, which is also saved to the state. Then on the user's side they upload the file using that URL (a process which is outside the scope of the backend concepts for this assignment). Then when the file needs to be retrieved (for displaying purposes for example), it should query the state of the concept using the same pre-signed URL to get the file information.

Am I getting the right idea? I'm just not sure how to spec, implement, and test this concept as I understand.

Additionally, should I even design, implement, and test a concept for this at this stage in our project?

**0**

Reply

***

Unresolved

@154\_f2

**Eagon Meng**  5 days ago

Answering here to keep the context of the discussion, but refer to Daniel's answer on your other post about the overview.

Your understanding is pretty much correct! One difference: you would likely not save the pre-signed URLs as state, but rather the actual URL (like <http://www.../document.pdf>) that it's saved to. Pre-signed URLs will be returned from the *concept action* as a way for a frontend or client to upload it, but they tend to be temporary and scoped, and don't need to be referred to again afterward. Instead, they are usually associated with a specific file in a specific location, and that location (URL) is what you should associate as the media content for state that represents something like a PDF document.

With this understanding, you should be able to test such a concept in the same way that a service like AWS S3: after say a creating/uploading action, your concept returns a pre-signed URL. Use that with curl or any other tool/library to upload some random PDF in your terminal with the URL. Optionally, you can have a concept action along the lines of "uploaded" to let the concept know that the item is uploaded. At this point, you should be able to verify in your concept state that a new item exists, it is associated with some stable URL, and if you visit that URL in your browser, you go directly to a PDF.

how would you recommend updating the documentmanget concept? and other concepts? note the change in concept specs and implementations (both regular .ts files and test .ts files)
