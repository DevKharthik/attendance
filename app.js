const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3001;

mongoose.connect('mongodb+srv://GOKUL:Gokul332003@credpro.yqti2tt.mongodb.net/credit-course-db?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to the database');
});

const attendanceSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  course: {
    type: String,
    required: true,
  },
  students: [
    {
      name: {
        type: String,
        required: true,
      },
      rollno: {
        type: String,
        required: true,
      },
      present: {
        type: Boolean,
        required: true,
      },
    },
  ],
});

const Attendance = mongoose.model('Attendance', attendanceSchema);
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.post('/storeAttendance', async (req, res) => {
  const { students } = req.body;

  try {
    const savedAttendanceData = [];
    for (const student of students) {
      const { name, rollno, present, date, course } = student;

      // Check if attendance data already exists for the specified date and course
      let existingAttendance = await Attendance.findOne({ date, course });

      // If the attendance data exists, update the student's attendance
      if (existingAttendance) {
        const existingStudent = existingAttendance.students.find(
          (existingStudent) => existingStudent.rollno === rollno
        );
        if (existingStudent) {
          existingStudent.present = present;
        } else {
          existingAttendance.students.push({ name, rollno, present });
        }
        const updatedAttendance = await existingAttendance.save();
        savedAttendanceData.push(updatedAttendance);
        console.log('Attendance updated successfully:', updatedAttendance);
      } else {
        // If the attendance data does not exist, create a new attendance entry
        const newAttendance = new Attendance({
          date,
          course,
          students: [{ name, rollno, present }],
        });
        const savedAttendance = await newAttendance.save();
        savedAttendanceData.push(savedAttendance);
        console.log('New attendance data saved:', savedAttendance);
      }
    }

    res.status(200).json(savedAttendanceData);
  } catch (error) {
    console.error('Error saving attendance data:', error);
    res.status(500).send('Error saving attendance data');
  }
});

app.get('/getAttendance', async (req, res) => {
  const { course, startDate, endDate } = req.query;

  
  try {
    const attendanceData = await Attendance.find({
      course,
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).sort({ date: -1, course: -1 });

    if (!attendanceData) {
      return res.status(404).json({ message: 'Attendance data not found for the specified date range and course.' });
    }

    const formattedData = attendanceData.map((attendance) => {
      const formattedStudents = attendance.students.map((student) => {
        return {
          name: student.name,
          rollno: student.rollno,
          present: student.present,
        };
      });

      return {
        _id: attendance._id,
        date: attendance.date.toISOString(),
        course: attendance.course,
        students: formattedStudents,
        _v: attendance._v,
      };
    });

    console.log('Received attendance data:', JSON.stringify(formattedData, null, 2));
    res.json(formattedData);
  } catch (error) {
    console.error('Error getting attendance data:', error);
    res.status(500).send('Error getting attendance data');
  }
});

app.get('/getstudentAttendance', async (req, res) => {
  const { course, rollno } = req.query;
  try {
    console.log('Request received for course:', course, 'and roll number:', rollno);
    const studentAttendance = await Attendance.find({
      course,
      'students.rollno': rollno
    });
    if (!studentAttendance || studentAttendance.length === 0) {
      console.log('Attendance data not found for the specified student.');
      return res.status(404).json({ message: 'Attendance data not found for the specified student.' });
    }
    const formattedData = studentAttendance.map((attendance) => {
      return {
        _id: attendance._id,
        date: attendance.date.toISOString(),
        course: attendance.course,
        student: attendance.students.find((student) => student.rollno === rollno),
        _v: attendance._v,
      };
    });
    console.log('Received student attendance data:', JSON.stringify(formattedData, null, 2));
    res.json(formattedData);
  } catch (error) {
    console.error('Error getting student attendance data:', error);
    res.status(500).send('Error getting student attendance data');
  }
});


app.get('/getAttendanceData', async (req, res) => {
  const { course, date } = req.query;

  try {
    const attendanceData = await Attendance.find({
      course,
      date:  new Date(date)
    }).sort({ date: -1, course: -1 });

    if (!attendanceData || attendanceData.length === 0) {
      return res.status(404).json({ message: 'Attendance data not found for the specified date and course.' });
    }

    const formattedData = attendanceData.map((attendance) => {
      const formattedStudents = attendance.students.map((student) => ({
        name: student.name,
        rollno: student.rollno,
        present: student.present,
      }));

      return {
        _id: attendance._id,
        date: attendance.date.toISOString(),
        course: attendance.course,
        students: formattedStudents,
        _v: attendance._v,
      };
    });

    console.log('Received attendance data:', JSON.stringify(formattedData, null, 2));
    res.json(formattedData);
  } catch (error) {
    console.error('Error getting attendance data:', error);
    res.status(500).send('Error getting attendance data');
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});