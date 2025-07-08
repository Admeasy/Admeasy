const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Student = require('../models/studentSchema');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const BackblazeB2Client = require('../b2Client');
const path = require('path');