Studio Yopaw — Dev Tasks
 Images

  - Replace the private event image with the kids' birthday photo(image: "C:\Users\BIT\Downloads\WhatsApp
  Image 2026-06-01 at 10.34.32.jpeg")
  - Set the corporate event image to the group of 5 people sitting on the ground(image:
  "C:\Users\BIT\Downloads\WhatsApp Image 2026-06-01 at 10.34.31 (1).jpeg")
  - Set the regular class image to the person doing a handstand(image: "C:\Users\BIT\Downloads\WhatsApp Image
  2026-06-01 at 10.34.31.jpeg") 

Booking flow & backend

- Update the booking flow:
    for private and corporate classes, we don't take the user to payment and book the class but instead we take the information of the user(date of reservation, number of people they are booking for, their contact info like phone number and email) and send an email with resend to the admin
I got this msg from the client"for the private/corporate events, forgot to add the date picker step after the question that asks the number of participants"
just check is this is the case
- Update the webhooks tied to the booking flow and what client said"For webhooks, want 1 webhook for the regular and 1 webhook for both private and corporate events. Show attendee count (no need for information about those attendees, just the main client) and for private/corporate, just the regular payload"


Payments (bugs)

 Fix taxes not always being applied on charges — tax must be included on every transaction, no exceptions
 Fix charges going through as a custom total instead of the booked service — the actual service must always be what gets charged, custom total should never be use