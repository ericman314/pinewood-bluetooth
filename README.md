# pinewood-bluetooth

Client web app for the pinewood derby track setup.

# How it works

There are three parts to the complete pinewood derby track setup:

1. Web server
2. Client web app (this repository)
3. Track and bluetooth peripheral

The web server provides API endpoints to save and restore race data. It also serves the React web app. It uses Node.js, express, and MariaDB.

The client browser runs a React web app that allows the user to interface with the track and manage a race. Using the client browser, the user can login, customize the event, register cars, and view results. Once the user's device connects to the track with Bluetooth, the user can also run the race and use a laptop to display live race results on a projector. The user can also plug in a webcam to enable the "instant replay" feature.

The track acts as a Bluetooth LE peripheral device and communicates with the client browser via the Web Bluetooth API. The track reports the following state variables: starting gate position (up or down), and time of finish line sensor crossing in each lane. These times are reset to 0 when the starting gate drops, and remain 0 until each car crosses the finish line.

# Web Server API

Included here for reference. Docs will be in the uvpd-v4 repo (eventually).

- `POST /api/v4/user/login` - Login a user
- `GET /api/v4/user/all` - List all users
- `POST /api/v4/user/create` - Create a user
- `POST /api/v4/user/update` - Update a user
- `POST /api/v4/user/delete` - Delete a user
- `GET /api/v4/event/all` - List all events
- `POST /api/v4/event/create` - Create an event
- `POST /api/v4/event/update` - Update an event
- `POST /api/v4/event/delete` - Delete an event
- `GET /api/v4/car/getByEventId` - Get cars by event id
- `GET /api/v4/result/getByEventId` - Get results by event id
- `POST /api/v4/result/create` - Save new result. Passing an array saves each item as a new result.
- `POST /api/v4/result/delete` - Delete result by id
- `GET /api/v4/car/getByEventIdWithAchievements` - Get cars by event id with achievements
- `POST /api/v4/car/create` - Create a car and check it into an event
- `POST /api/v4/car/update` - Update a car
- `POST /api/v4/car/delete` - Delete a car permanently
- `GET /api/v4/car/:id.jpg` - Get the car's image
- `GET /api/v4/achievement/getByEventId` Get achievements by event id
- `POST /api/v4/achievement/create` Create new achievement



# Client App

The client app does most of the heavy lifting. Its various features include:

## User management

In a typical scenario, the admin will create a username/password combination for the derby event manager(s). This will allow the manager(s) to login and perform other actions.

Anonymous visitors may:

- See list of all events
- See results from any event

Event managers may also:

- Add or remove cars from their event
- Run their own race (as long as they are connected to the track)

The admin may also:

- Create and manage event details
- Create and edit user details
- Add or remove cars from any event
- Run any race
- Simulate running a race when not connected to the track

## Event management

The admin may create, edit, and delete events. The admin may also assign a user as an event manager.

## Car check-in and editing

The admin and event manager may add, update, and delete cars within their event--or, for admins, any event. When cars are added, they are immediately added to the race. When a car is deleted, the car is just marked as "deleted"--it is not actually removed from the database. Event managers can see deleted cars. Managers can also "defer" a car without removing it, which means it will not be assigned to any additional races, but it will still appear in the results.

## Running a race

Managers and admins can connect to the track to run a race. (Admins can also connect to a simulated track.) 

When running a race, the normal interface is replaced with a full screen live interface. The web app uses the currently loaded event to assign cars to races, display the cars and results, and show the instant replay.

## Unmanaged race

When an internet connection is unreliable, or when there is no need to check-in cars or record results, admins and managers that connect to the track can run the race in "unmanaged" mode. The full screen interface will only show times and the instant replay.

## Automatic data updates

Through socket messages, the client side data is always kept up to date in the event that multiple users, or one user and an admin, are concurrently managing a race.