import ContactSubmission from "../models/ContactSubmission.model.js";

// Save a new contact submission
export const createContactSubmission = async (req, res) => {
    console.log(req.body)
  try {
    const { fullname, email, phone, message } = req.body;

    if (!fullname || !email || !message) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    await ContactSubmission.create({
      fullname,
      email,
      phone,
      message,
    });

    // TODO: trigger email notification if needed

    res.status(201).json({ success: true, message: "Submission received" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
